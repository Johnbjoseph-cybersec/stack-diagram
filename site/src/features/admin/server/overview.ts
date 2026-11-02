import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, gte, type SQL, sql } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth.ts";
import { getDb } from "@/lib/db/client.ts";
import { SUBMISSION_MODES, stacks } from "@/lib/db/schema.ts";
import { getSubmissionMode, setSubmissionMode } from "@/lib/settings.ts";

import { requireAdminOrNotFound } from "./guard.ts";
import { queuedWhere } from "./rules.ts";

const countWhere = (condition: SQL | undefined) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export const fetchAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminOrNotFound();
  const db = getDb();
  const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const [mode, [counts]] = await Promise.all([
    getSubmissionMode(db),
    db
      .select({
        today: countWhere(gte(stacks.createdAt, startOfDay)),
        queue: countWhere(queuedWhere),
        hidden: countWhere(eq(stacks.status, "hidden")),
        published: countWhere(eq(stacks.status, "published")),
      })
      .from(stacks),
  ]);
  return {
    mode,
    today: counts?.today ?? 0,
    dailyLimit: Number(env.DAILY_LIMIT),
    siteUrl: env.SITE_URL,
    counts: {
      queue: counts?.queue ?? 0,
      hidden: counts?.hidden ?? 0,
      published: counts?.published ?? 0,
    },
  };
});

export const setMode = createServerFn({ method: "POST" })
  .validator(z.object({ mode: z.enum(SUBMISSION_MODES) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await setSubmissionMode(getDb(), data.mode);
    return { ok: true };
  });
