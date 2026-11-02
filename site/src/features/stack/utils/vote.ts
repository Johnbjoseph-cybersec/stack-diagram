import type { Vote } from "../server/rules.ts";

export const scoreAfterVote = (score: number, from: Vote, to: Vote) => score - from + to;
