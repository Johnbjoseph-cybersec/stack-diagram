import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import type { Db } from "./db/client.ts";
import { SUBMISSION_MODES, settings } from "./db/schema.ts";

export type SubmissionMode = (typeof SUBMISSION_MODES)[number];

const isSubmissionMode = (value: unknown): value is SubmissionMode =>
  SUBMISSION_MODES.some((mode) => mode === value);

/** An unknown value falls back to review, so a typo never opens the gallery. */
export async function getSubmissionMode(db: Db): Promise<SubmissionMode> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "submissions"));
  const value = row?.value ?? env.SUBMISSIONS;
  return isSubmissionMode(value) ? value : "review";
}

export async function setSubmissionMode(db: Db, mode: SubmissionMode) {
  await db
    .insert(settings)
    .values({ key: "submissions", value: mode })
    .onConflictDoUpdate({ target: settings.key, set: { value: mode, updatedAt: new Date() } });
}
