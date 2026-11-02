import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { httpError, requireAdmin } from "@/lib/auth.ts";
import { type Db, getDb } from "@/lib/db/client.ts";
import { reporterStrikes, reports, stacks } from "@/lib/db/schema.ts";
import { deleteStackFiles } from "@/lib/storage.ts";

import { ACTIONS, canModerate } from "../moderation.ts";
import { strikeTargets } from "./rules.ts";

/** Sets the status and clears the reports; publishing overrules the reporters, so each gets a strike. */
async function settle(db: Db, id: string, status: "published" | "hidden") {
  const reporters =
    status === "published"
      ? strikeTargets(
          await db
            .select({ reporterHash: reports.reporterHash })
            .from(reports)
            .where(eq(reports.stackId, id)),
        )
      : [];
  const clearReports = db.delete(reports).where(eq(reports.stackId, id));
  const update = db.update(stacks).set({ status, reports: 0 }).where(eq(stacks.id, id));
  if (reporters.length === 0) {
    await db.batch([clearReports, update]);
    return;
  }
  const strike = db
    .insert(reporterStrikes)
    .values(reporters.map((reporterHash) => ({ reporterHash, strikes: 1 })))
    .onConflictDoUpdate({
      target: reporterStrikes.reporterHash,
      set: { strikes: sql`${reporterStrikes.strikes} + 1`, updatedAt: new Date() },
    });
  await db.batch([strike, clearReports, update]);
}

export const moderate = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), action: z.enum(ACTIONS) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const [post] = await db
      .select({ status: stacks.status, reports: stacks.reports })
      .from(stacks)
      .where(eq(stacks.id, data.id));
    if (!post) {
      throw httpError(404, "This post no longer exists.");
    }
    if (!canModerate(post, data.action)) {
      throw httpError(409, "This post has changed. Reload and try again.");
    }
    switch (data.action) {
      case "publish":
      case "keep":
        await settle(db, data.id, "published");
        break;
      case "hide":
        await settle(db, data.id, "hidden");
        break;
      case "delete":
        await db.delete(stacks).where(eq(stacks.id, data.id));
        await deleteStackFiles(env.BUCKET, data.id);
        break;
    }
    return { ok: true };
  });
