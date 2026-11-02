import { describe, expect, test } from "vite-plus/test";

import { moderationMeta, reasonChips } from "./labels.ts";

const NO_REPORTS = { spam: 0, abuse: 0, exposure: 0, other: 0 };
const CLEAN = { diagram: 0.93, abuse: 0.01, spam: 0.04, exposure: 0.02 };

describe("reasonChips", () => {
  test("a risk score at 0.5 or more is flagged and comes first", () => {
    expect(
      reasonChips({ reportReasons: NO_REPORTS, scores: { ...CLEAN, exposure: 0.82 } }),
    ).toEqual([
      { label: "Exposure 0.82", flagged: true },
      { label: "Spam 0.04", flagged: false },
      { label: "Abuse 0.01", flagged: false },
      { label: "Diagram 0.93", flagged: false },
    ]);
  });

  test("a diagram score under 0.5 is flagged", () => {
    expect(
      reasonChips({ reportReasons: NO_REPORTS, scores: { ...CLEAN, diagram: 0.18 } })[0],
    ).toEqual({ label: "Diagram 0.18", flagged: true });
  });

  test("the line sits where submission holds a post", () => {
    const chips = reasonChips({
      reportReasons: NO_REPORTS,
      scores: { diagram: 0.5, abuse: 0.5, spam: 0.49, exposure: 0 },
    });
    expect(chips.filter((chip) => chip.flagged).map((chip) => chip.label)).toEqual(["Abuse 0.50"]);
  });

  test("a clean post held in review has only plain chips", () => {
    expect(
      reasonChips({ reportReasons: NO_REPORTS, scores: CLEAN }).some((chip) => chip.flagged),
    ).toBe(false);
  });

  test("reports replace scores, with exposure flagged", () => {
    expect(
      reasonChips({ reportReasons: { ...NO_REPORTS, spam: 1, exposure: 1 }, scores: CLEAN }),
    ).toEqual([
      { label: "Reported: exposure", flagged: true },
      { label: "Reported: spam", flagged: false },
    ]);
  });

  test("a post without scores or reports has no chips", () => {
    expect(reasonChips({ reportReasons: NO_REPORTS, scores: null })).toEqual([]);
  });
});

describe("moderationMeta", () => {
  test("a held post is not public yet", () => {
    expect(moderationMeta({ status: "held", reports: 0 })).toBe("Not public yet");
  });

  test("other posts show their reports", () => {
    expect(moderationMeta({ status: "published", reports: 2 })).toBe("2 reports");
    expect(moderationMeta({ status: "hidden", reports: 1 })).toBe("1 report");
    expect(moderationMeta({ status: "published", reports: 0 })).toBe("0 reports");
  });
});
