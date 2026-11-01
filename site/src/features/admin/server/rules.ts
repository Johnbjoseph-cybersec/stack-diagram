import { eq, gt, or } from "drizzle-orm";

import { stacks } from "@/lib/db/schema.ts";

import type { Tab } from "../moderation.ts";

// Reported posts stay queued after reports hide them, until an admin settles the reports.
export const queuedWhere = or(eq(stacks.status, "held"), gt(stacks.reports, 0));

export const tabWhere = (tab: Tab) => (tab === "queue" ? queuedWhere : eq(stacks.status, tab));

export const strikeTargets = (rows: { reporterHash: string }[]) => [
  ...new Set(rows.map((row) => row.reporterHash)),
];
