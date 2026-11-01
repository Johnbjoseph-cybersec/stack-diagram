import { describe, expect, it } from "vite-plus/test";

import { reportLimitError, shouldHide, toVote, voteLimitError } from "./rules.ts";

describe("toVote", () => {
  it.each([
    [5, 1],
    [1, 1],
    [0, 0],
    [-1, -1],
    [-2, -1],
  ])("maps %i to %i", (value, vote) => {
    expect(toVote(value)).toBe(vote);
  });
});

describe("voteLimitError", () => {
  const counts = { voterDay: 0, networkDay: 0, networkPostDay: 0 };

  it("allows votes under every cap", () => {
    expect(voteLimitError({ voterDay: 199, networkDay: 999, networkPostDay: 9 })).toBeNull();
  });

  it("stops a voter at 200 votes a day", () => {
    expect(voteLimitError({ ...counts, voterDay: 200 })).toBe("Too many votes today");
  });

  it("stops a network at 10 votes on one post", () => {
    expect(voteLimitError({ ...counts, networkPostDay: 10 })).toMatch(/on this post/);
  });

  it("stops a network at 1000 votes a day", () => {
    expect(voteLimitError({ ...counts, networkDay: 1000 })).toMatch(/your network/);
  });
});

describe("reportLimitError", () => {
  const counts = { reporterDay: 0, reporterExposureDay: 0, networkDay: 0 };

  it("allows reports under every cap", () => {
    expect(
      reportLimitError({ reporterDay: 9, reporterExposureDay: 2, networkDay: 29 }, "exposure"),
    ).toBeNull();
  });

  it("stops a reporter at 10 reports a day", () => {
    expect(reportLimitError({ ...counts, reporterDay: 10 }, "spam")).toBe("Too many reports today");
  });

  it("stops a reporter at 3 exposure reports a day", () => {
    expect(reportLimitError({ ...counts, reporterExposureDay: 3 }, "exposure")).toBe(
      "Too many exposure reports today",
    );
  });

  it("lets a reporter at the exposure cap still report other reasons", () => {
    expect(reportLimitError({ ...counts, reporterExposureDay: 3 }, "abuse")).toBeNull();
  });

  it("stops a network at 30 reports a day", () => {
    expect(reportLimitError({ ...counts, networkDay: 30 }, "other")).toMatch(/your network/);
  });
});

const spam = (strikes = 0) => ({ reason: "spam" as const, strikes });
const exposure = (strikes = 0) => ({ reason: "exposure" as const, strikes });
const DAY = 24 * 60 * 60 * 1000;
const latest = (report: ReturnType<typeof spam | typeof exposure>, passAge = DAY) => ({
  ...report,
  passAge,
});

describe("shouldHide", () => {
  it("keeps a post with two reports", () => {
    expect(shouldHide([spam(), spam()], latest(spam()))).toBe(false);
  });

  it("hides a post at three reports", () => {
    expect(shouldHide([spam(), spam(), spam()], latest(spam()))).toBe(true);
  });

  it("counts reporters with one strike", () => {
    expect(shouldHide([spam(1), spam(1), spam()], latest(spam()))).toBe(true);
  });

  it("ignores reporters with two or more strikes", () => {
    expect(shouldHide([spam(), spam(), spam(2), spam(5)], latest(spam(5)))).toBe(false);
  });

  it("hides on one exposure report from a reporter without strikes whose pass is a day old", () => {
    expect(shouldHide([exposure()], latest(exposure()))).toBe(true);
  });

  it("counts an exposure report from a newer pass like any other", () => {
    expect(shouldHide([exposure()], latest(exposure(), DAY - 1))).toBe(false);
    expect(shouldHide([spam(), spam(), exposure()], latest(exposure(), 0))).toBe(true);
  });

  it("counts an exposure report from a struck reporter like any other", () => {
    expect(shouldHide([exposure(1)], latest(exposure(1)))).toBe(false);
    expect(shouldHide([spam(), spam(), exposure(1)], latest(exposure(1)))).toBe(true);
    expect(shouldHide([spam(), spam(), exposure(2)], latest(exposure(2)))).toBe(false);
  });

  it("decides on the latest report, so an older exposure report alone does not hide again", () => {
    expect(shouldHide([exposure(), spam()], latest(spam()))).toBe(false);
  });
});
