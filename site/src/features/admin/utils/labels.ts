import type { Scores } from "@/lib/db/schema.ts";
import { DIAGRAM_AT, FLAG_AT } from "@/lib/moderation.ts";

import type { AdminItem } from "../server/queue.ts";

const SCORE_NAMES: Record<keyof Scores, string> = {
  spam: "Spam",
  abuse: "Abuse",
  exposure: "Exposure",
  diagram: "Diagram",
};

const SCORE_ORDER = ["spam", "abuse", "exposure", "diagram"] as const;

const REPORT_ORDER = ["exposure", "abuse", "spam", "other"] as const;

export type ReasonChip = { label: string; flagged: boolean };

const isFlagged = (key: keyof Scores, value: number) =>
  key === "diagram" ? value < DIAGRAM_AT : value >= FLAG_AT;

/** Why a post is in the queue: its reports if it has any, else its Clef scores, flagged ones first. */
export function reasonChips({
  reportReasons,
  scores,
}: Pick<AdminItem, "reportReasons" | "scores">): ReasonChip[] {
  const reported = REPORT_ORDER.filter((reason) => reportReasons[reason] > 0).map((reason) => ({
    label: `Reported: ${reason}`,
    // One exposure report is enough to hide a post.
    flagged: reason === "exposure",
  }));
  if (reported.length > 0 || !scores) {
    return reported;
  }
  const chips = SCORE_ORDER.map((key) => ({
    label: `${SCORE_NAMES[key]} ${scores[key].toFixed(2)}`,
    flagged: isFlagged(key, scores[key]),
  }));
  return [...chips.filter((chip) => chip.flagged), ...chips.filter((chip) => !chip.flagged)];
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

export const moderationMeta = (item: Pick<AdminItem, "status" | "reports">) =>
  item.status === "held" ? "Not public yet" : count(item.reports, "report");
