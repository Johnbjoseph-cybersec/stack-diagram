import { describe, expect, it } from "vite-plus/test";

import { sha256Bytes } from "@/lib/crypto.ts";

import { CHALLENGE_TTL, issueChallenge, leadingZeroBits, verifyProof } from "./pow.ts";

const SECRET = "pow-secret";
const NOW = 1_800_000_000_000;

async function solve(challenge: string, bits: number) {
  for (let n = 0; ; n++) {
    const proof = `${challenge}:${n}`;
    if (leadingZeroBits(await sha256Bytes(proof)) >= bits) {
      return proof;
    }
  }
}

describe("leadingZeroBits", () => {
  it("counts zero bits across bytes", () => {
    expect(leadingZeroBits(new Uint8Array([0x80, 0]))).toBe(0);
    expect(leadingZeroBits(new Uint8Array([0, 0x0f]))).toBe(12);
    expect(leadingZeroBits(new Uint8Array([0, 0]))).toBe(16);
  });
});

describe("verifyProof", () => {
  it("accepts a solved challenge up to the end of its lifetime", async () => {
    const challenge = await issueChallenge(SECRET, NOW);
    const proof = await solve(challenge, 8);
    await expect(verifyProof(SECRET, proof, 8, NOW + CHALLENGE_TTL)).resolves.toEqual({
      ok: true,
      challenge,
    });
  });

  it("turns away an expired challenge", async () => {
    const proof = await solve(await issueChallenge(SECRET, NOW), 4);
    await expect(verifyProof(SECRET, proof, 4, NOW + CHALLENGE_TTL + 1)).resolves.toEqual({
      ok: false,
      error: "The challenge expired. Run share again",
    });
  });

  it("turns away a proof with fewer zero bits than asked", async () => {
    const proof = await solve(await issueChallenge(SECRET, NOW), 4);
    const bits = leadingZeroBits(await sha256Bytes(proof));
    await expect(verifyProof(SECRET, proof, bits + 1, NOW)).resolves.toEqual({
      ok: false,
      error: "The proof of work does not meet the difficulty",
    });
  });

  it("turns away a tampered challenge and one signed with another secret", async () => {
    const challenge = await issueChallenge(SECRET, NOW);
    const [issuedAt, random, signature] = challenge.split(".");
    const extended = `${Number(issuedAt) + CHALLENGE_TTL}.${random}.${signature}`;
    const forged = await issueChallenge("other-secret", NOW);
    for (const proof of [await solve(extended, 0), await solve(forged, 0)]) {
      await expect(verifyProof(SECRET, proof, 0, NOW)).resolves.toEqual({
        ok: false,
        error: "The challenge is not one this gallery issued",
      });
    }
  });

  it("turns away malformed proofs", async () => {
    const challenge = await issueChallenge(SECRET, NOW);
    for (const proof of ["", challenge, `${challenge}:`, `${challenge}:1x`, `x${challenge}:1`]) {
      await expect(verifyProof(SECRET, proof, 0, NOW)).resolves.toMatchObject({ ok: false });
    }
  });
});
