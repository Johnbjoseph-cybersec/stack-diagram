import { describe, expect, it } from "vite-plus/test";

import { decide, parseScores } from "./moderation.ts";

const CLEAN = { diagram: 0.9, abuse: 0.01, spam: 0.02, exposure: 0.03 };

const answer = (noul: number) => ({ type: "noul", noul });

describe("decide", () => {
  it("publishes a clean diagram while submissions are open", () => {
    expect(decide("open", CLEAN)).toBe("published");
    expect(decide("open", { ...CLEAN, diagram: 0.5, abuse: 0.49 })).toBe("published");
  });

  it("holds everything in review mode", () => {
    expect(decide("review", CLEAN)).toBe("held");
  });

  it("holds when Clef gave no scores", () => {
    expect(decide("open", null)).toBe("held");
  });

  it("holds at 0.5 abuse, spam or exposure, or under 0.5 diagram", () => {
    for (const flag of ["abuse", "spam", "exposure"] as const) {
      expect(decide("open", { ...CLEAN, [flag]: 0.5 })).toBe("held");
    }
    expect(decide("open", { ...CLEAN, diagram: 0.49 })).toBe("held");
  });
});

describe("parseScores", () => {
  it("reads the yes probability of each question", () => {
    const answers = {
      diagram: answer(0.9),
      abuse: answer(0),
      spam: answer(0.1),
      exposure: answer(1),
    };
    expect(parseScores({ model: "clef-flash", answers, usage: {} })).toEqual({
      diagram: 0.9,
      abuse: 0,
      spam: 0.1,
      exposure: 1,
    });
  });

  it("gives null for anything unexpected, so the post is held", () => {
    const answers = {
      diagram: answer(0.9),
      abuse: answer(0),
      spam: answer(0.1),
      exposure: answer(0),
    };
    expect(parseScores({ answers: { ...answers, exposure: undefined } })).toBeNull();
    expect(parseScores({ answers: { ...answers, abuse: answer(1.2) } })).toBeNull();
    expect(parseScores({ answers: { ...answers, spam: { type: "score", score: 0 } } })).toBeNull();
    expect(parseScores({ answers: { ...answers, diagram: answer(Number.NaN) } })).toBeNull();
    expect(parseScores({ error: "model overloaded" })).toBeNull();
    expect(parseScores(null)).toBeNull();
  });
});
