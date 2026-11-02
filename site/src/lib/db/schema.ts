import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type Scores = { diagram: number; abuse: number; spam: number; exposure: number };

export type StackItem = {
  name: string;
  iconKey: string | null;
  iconDarkKey: string | null;
  wide: boolean;
};

export const STATUSES = ["published", "held", "hidden"] as const;
export const REPORT_REASONS = ["spam", "abuse", "exposure", "other"] as const;
export const SUBMISSION_MODES = ["open", "review", "closed"] as const;

export const stacks = pgTable(
  "stacks",
  {
    id: text().primaryKey(),
    title: text().notNull(),
    stack: jsonb().$type<StackItem[]>().notNull(),
    stackKeys: text().array().notNull(),
    name: text().notNull(),
    githubLogin: text(),
    githubId: text(),
    status: text({ enum: STATUSES }).notNull(),
    scores: jsonb().$type<Scores>(),
    width: integer().notNull(),
    height: integer().notNull(),
    score: integer().notNull().default(0),
    reports: integer().notNull().default(0),
    deleteKeyHash: text().notNull(),
    ipHash: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stacks_status_created_idx").on(t.status, t.createdAt),
    index("stacks_status_score_idx").on(t.status, t.score),
    index("stacks_github_id_idx").on(t.githubId),
    index("stacks_stack_keys_idx").using("gin", t.stackKeys),
    index("stacks_stack_idx").using("gin", sql`${t.stack} jsonb_path_ops`),
  ],
);

export const votes = pgTable(
  "votes",
  {
    stackId: text()
      .notNull()
      .references(() => stacks.id, { onDelete: "cascade" }),
    voterHash: text().notNull(),
    ipHash: text().notNull(),
    value: smallint().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.stackId, t.voterHash] }),
    index("votes_voter_created_idx").on(t.voterHash, t.createdAt),
    index("votes_ip_created_idx").on(t.ipHash, t.createdAt),
  ],
);

export const reports = pgTable(
  "reports",
  {
    stackId: text()
      .notNull()
      .references(() => stacks.id, { onDelete: "cascade" }),
    reporterHash: text().notNull(),
    ipHash: text().notNull(),
    reason: text({ enum: REPORT_REASONS }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.stackId, t.reporterHash] }),
    index("reports_reporter_created_idx").on(t.reporterHash, t.createdAt),
    index("reports_ip_created_idx").on(t.ipHash, t.createdAt),
  ],
);

/** Reports an admin overruled with Keep; reporters with strikes stop counting toward hiding. */
export const reporterStrikes = pgTable("reporter_strikes", {
  reporterHash: text().primaryKey(),
  strikes: integer().notNull().default(0),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const usedChallenges = pgTable(
  "used_challenges",
  {
    hash: text().primaryKey(),
    ipHash: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("used_challenges_created_at_idx").on(t.createdAt)],
);

/** Runtime switches the admin page changes; `submissions` overrides the SUBMISSIONS var. */
export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
