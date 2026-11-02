import { describe, expect, it } from "vite-plus/test";

import { scoreAfterVote } from "./vote.ts";

describe("scoreAfterVote", () => {
  it.each([
    [10, 0, 1, 11],
    [10, 1, 0, 9],
    [10, 1, -1, 8],
    [10, -1, 1, 12],
    [0, 0, -1, -1],
    [5, 1, 1, 5],
  ] as const)("moves %i from %i to %i as %i", (score, from, to, next) => {
    expect(scoreAfterVote(score, from, to)).toBe(next);
  });
});
