import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { z } from "zod";

import { type Db, getDb } from "@/lib/db/client.ts";
import { REPORT_REASONS, reporterStrikes, reports, stacks } from "@/lib/db/schema.ts";

import { httpError, stackId, strictInput, turnstileToken } from "./input.ts";
import { type ReportCounts, reportLimitError, shouldHide } from "./rules.ts";
import { limitActions, requireVoter, voterHash } from "./voter.ts";

const ReportInput = z.strictObject({
  id: stackId,
  reason: z.enum(REPORT_REASONS),
  turnstileToken: turnstileToken.optional(),
});

async function reportCounts(db: Db, reporter: string, ip: string): Promise<ReportCounts> {
  const [counts] = await db
    .select({
      reporterDay: sql<number>`(count(*) filter (where ${reports.reporterHash} = ${reporter}))::int`,
      reporterExposureDay: sql<number>`(count(*) filter (where ${reports.reporterHash} = ${reporter} and ${reports.reason} = 'exposure'))::int`,
      networkDay: sql<number>`(count(*) filter (where ${reports.ipHash} = ${ip}))::int`,
    })
    .from(reports)
    .where(
      and(
        gt(reports.createdAt, sql`now() - interval '1 day'`),
        or(eq(reports.reporterHash, reporter), eq(reports.ipHash, ip)),
      ),
    );
  return counts ?? { reporterDay: 0, reporterExposureDay: 0, networkDay: 0 };
}

/** Always `{ ok: true }` once past the challenge, so reporters learn nothing about counts or status. */
export const reportStack = createServerFn({ method: "POST" })
  .validator(strictInput(ReportInput))
  .handler(async ({ data }): Promise<{ needsChallenge: true } | { ok: true }> => {
    const request = getRequest();
    const ip = await limitActions(request);
    const pass = await requireVoter(request, data.turnstileToken);
    if (!pass) {
      return { needsChallenge: true };
    }
    const reporter = await voterHash(pass.id);
    const db = getDb();
    const [stack] = await db
      .select({ status: stacks.status })
      .from(stacks)
      .where(eq(stacks.id, data.id));
    if (stack?.status !== "published") {
      return { ok: true };
    }
    const error = reportLimitError(await reportCounts(db, reporter, ip), data.reason);
    if (error) {
      throw httpError(429, error);
    }
    const inserted = await db
      .insert(reports)
      .values({ stackId: data.id, reporterHash: reporter, ipHash: ip, reason: data.reason })
      .onConflictDoNothing()
      .returning({ stackId: reports.stackId });
    if (inserted.length === 0) {
      return { ok: true };
    }
    const [, standing] = await db.batch([
      db
        .update(stacks)
        .set({ reports: sql`${stacks.reports} + 1` })
        .where(eq(stacks.id, data.id)),
      db
        .select({
          reporterHash: reports.reporterHash,
          reason: reports.reason,
          strikes: sql<number>`coalesce(${reporterStrikes.strikes}, 0)::int`,
        })
        .from(reports)
        .leftJoin(reporterStrikes, eq(reporterStrikes.reporterHash, reports.reporterHash))
        .where(eq(reports.stackId, data.id)),
    ]);
    const latest = {
      reason: data.reason,
      strikes: standing.find((row) => row.reporterHash === reporter)?.strikes ?? 0,
      passAge: Date.now() - pass.issuedAt,
    };
    if (shouldHide(standing, latest)) {
      await db
        .update(stacks)
        .set({ status: "hidden" })
        .where(and(eq(stacks.id, data.id), eq(stacks.status, "published")));
    }
    return { ok: true };
  });
