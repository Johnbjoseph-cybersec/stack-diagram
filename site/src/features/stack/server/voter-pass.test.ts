import { describe, expect, it } from "vite-plus/test";

import { hmac } from "@/lib/crypto.ts";

import { issueVoterPass, signVoterPass, VOTER_PASS_MS, verifyVoterPass } from "./voter-pass.ts";

const SECRET = "test-secret";
const NOW = 1_793_500_000_000;

describe("voter pass", () => {
  it("verifies a pass it issued and returns its voter id", async () => {
    const pass = await issueVoterPass(SECRET, NOW);
    expect(pass.id).toMatch(/^[\w-]{22}$/);
    expect(await verifyVoterPass(SECRET, pass.value, NOW)).toEqual({ id: pass.id, issuedAt: NOW });
  });

  it("issues a new voter id each time", async () => {
    const [a, b] = await Promise.all([issueVoterPass(SECRET, NOW), issueVoterPass(SECRET, NOW)]);
    expect(a.id).not.toBe(b.id);
  });

  it("expires after seven days", async () => {
    const pass = await issueVoterPass(SECRET, NOW);
    expect((await verifyVoterPass(SECRET, pass.value, NOW + VOTER_PASS_MS - 1))?.id).toBe(pass.id);
    expect(await verifyVoterPass(SECRET, pass.value, NOW + VOTER_PASS_MS)).toBeNull();
  });

  it("rejects a pass signed with another secret", async () => {
    const pass = await issueVoterPass("other-secret", NOW);
    expect(await verifyVoterPass(SECRET, pass.value, NOW)).toBeNull();
  });

  it("rejects a pass whose id or expiry was changed", async () => {
    const value = await signVoterPass(SECRET, "voter-a", NOW + 1000);
    const [, expires, signature] = value.split(".");
    expect(await verifyVoterPass(SECRET, `voter-b.${expires}.${signature}`, NOW)).toBeNull();
    expect(
      await verifyVoterPass(SECRET, `voter-a.${NOW + VOTER_PASS_MS}.${signature}`, NOW),
    ).toBeNull();
  });

  it("rejects a forged signature", async () => {
    const value = await signVoterPass(SECRET, "voter-a", NOW + 1000);
    const forged = value.replace(/[0-9a-f]{64}$/, "0".repeat(64));
    expect(await verifyVoterPass(SECRET, forged, NOW)).toBeNull();
  });

  it("rejects an HMAC of the same text without the voter prefix", async () => {
    const expiresAt = NOW + 1000;
    const unprefixed = await hmac(SECRET, `voter-a.${expiresAt}`);
    expect(await verifyVoterPass(SECRET, `voter-a.${expiresAt}.${unprefixed}`, NOW)).toBeNull();
  });

  it.each(["", "abc", "a.b.c", "a..0", "a.1.2.3", "a b.99999999999999.x"])(
    "rejects the malformed value %j",
    async (value) => {
      expect(await verifyVoterPass(SECRET, value, NOW)).toBeNull();
    },
  );
});
