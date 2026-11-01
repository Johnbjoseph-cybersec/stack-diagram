import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.ts";
import { type REPORT_REASONS, reports, type Scores, stacks } from "@/lib/db/schema.ts";
import { type PublicStack, toPublicStack } from "@/lib/public-stack.ts";

import { type Status, TABS } from "../moderation.ts";
import { requireAdminOrNotFound } from "./guard.ts";
import { tabWhere } from "./rules.ts";

const PAGE_SIZE = 24;

type ReportReason = (typeof REPORT_REASONS)[number];

export type AdminItem = PublicStack & {
  status: Status;
  reports: number;
  reportReasons: Record<ReportReason, number>;
  scores: Scores | null;
};

export type QueueCursor = { createdAt: string; id: string };

const noReports = (): Record<ReportReason, number> => ({
  spam: 0,
  abuse: 0,
  exposure: 0,
  other: 0,
});

export const fetchAdminQueue = createServerFn({ method: "GET" })
  .validator(
    z.object({
      tab: z.enum(TABS),
      cursor: z.object({ createdAt: z.iso.datetime(), id: z.string() }).optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ items: AdminItem[]; nextCursor: QueueCursor | null }> => {
    await requireAdminOrNotFound();
    const db = getDb();
    const { cursor } = data;
    const after = cursor
      ? or(
          lt(stacks.createdAt, new Date(cursor.createdAt)),
          and(eq(stacks.createdAt, new Date(cursor.createdAt)), lt(stacks.id, cursor.id)),
        )
      : undefined;
    const rows = await db
      .select()
      .from(stacks)
      .where(and(tabWhere(data.tab), after))
      .orderBy(desc(stacks.createdAt), desc(stacks.id))
      .limit(PAGE_SIZE + 1);
    const page = rows.slice(0, PAGE_SIZE);

    const reasons = new Map<string, Record<ReportReason, number>>();
    if (page.length > 0) {
      const tallies = await db
        .select({ stackId: reports.stackId, reason: reports.reason, total: count() })
        .from(reports)
        .where(
          inArray(
            reports.stackId,
            page.map((row) => row.id),
          ),
        )
        .groupBy(reports.stackId, reports.reason);
      for (const { stackId, reason, total } of tallies) {
        const tally = reasons.get(stackId) ?? noReports();
        tally[reason] = total;
        reasons.set(stackId, tally);
      }
    }

    const last = page.at(-1);
    return {
      items: page.map((row) => ({
        ...toPublicStack(row),
        status: row.status,
        reports: row.reports,
        reportReasons: reasons.get(row.id) ?? noReports(),
        scores: row.scores,
      })),
      nextCursor:
        rows.length > PAGE_SIZE && last
          ? { createdAt: last.createdAt.toISOString(), id: last.id }
          : null,
    };
  });
