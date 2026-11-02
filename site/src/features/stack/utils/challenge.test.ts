import { describe, expect, it, vi } from "vite-plus/test";

import { ChallengeClosed, NOT_SET_UP, withChallenge } from "./challenge.ts";

type Result = { score: number } | { needsChallenge: true };

const challenge = { needsChallenge: true } as const;

const sender = (...results: Result[]) => {
  const queue = [...results];
  return vi.fn((_token?: string) => Promise.resolve(queue.shift() ?? challenge));
};

const solver = () => {
  let count = 0;
  return vi.fn(() => Promise.resolve(`token-${++count}`));
};

describe("withChallenge", () => {
  it("sends once without a token when the visitor has a pass", async () => {
    const send = sender({ score: 1 });
    const solve = solver();
    await expect(withChallenge(send, solve, { hasPass: true })).resolves.toEqual({ score: 1 });
    expect(send.mock.calls).toEqual([[undefined]]);
    expect(solve).not.toHaveBeenCalled();
  });

  it("solves first and sends the token when the visitor has no pass", async () => {
    const send = sender({ score: 1 });
    const solve = solver();
    await expect(withChallenge(send, solve, { hasPass: false })).resolves.toEqual({ score: 1 });
    expect(send.mock.calls).toEqual([["token-1"]]);
  });

  it("retries with a token when an expired pass asks for the challenge", async () => {
    const send = sender(challenge, { score: 2 });
    const solve = solver();
    await expect(withChallenge(send, solve, { hasPass: true })).resolves.toEqual({ score: 2 });
    expect(send.mock.calls).toEqual([[undefined], ["token-1"]]);
  });

  it("solves again once when a token is rejected", async () => {
    const send = sender(challenge, { score: 3 });
    const solve = solver();
    await expect(withChallenge(send, solve, { hasPass: false })).resolves.toEqual({ score: 3 });
    expect(send.mock.calls).toEqual([["token-1"], ["token-2"]]);
  });

  it("gives up after two rejected tokens", async () => {
    const send = sender();
    const solve = solver();
    await expect(withChallenge(send, solve, { hasPass: true })).rejects.toThrow(NOT_SET_UP);
    expect(send.mock.calls).toEqual([[undefined], ["token-1"], ["token-2"]]);
  });

  it("stops without sending when the challenge is closed", async () => {
    const send = sender({ score: 1 });
    const solve = vi.fn(() => Promise.reject(new ChallengeClosed()));
    await expect(withChallenge(send, solve, { hasPass: false })).rejects.toBeInstanceOf(
      ChallengeClosed,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("passes server errors through", async () => {
    const send = vi.fn(() => Promise.reject(new Error("Too many votes today")));
    await expect(withChallenge(send, solver(), { hasPass: true })).rejects.toThrow(
      "Too many votes today",
    );
  });
});
