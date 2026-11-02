import { hmac, randomToken, safeEqual } from "@/lib/crypto.ts";

export const VOTER_COOKIE = "sd_voter";
export const VOTER_PASS_MS = 7 * 24 * 60 * 60 * 1000;

// The prefix keeps these signatures apart from other uses of POW_SECRET.
const signature = (secret: string, id: string, expiresAt: number) =>
  hmac(secret, `voter:${id}.${expiresAt}`);

export const signVoterPass = async (secret: string, id: string, expiresAt: number) =>
  `${id}.${expiresAt}.${await signature(secret, id, expiresAt)}`;

export type Voter = { id: string; issuedAt: number };

export async function issueVoterPass(secret: string, now: number) {
  const id = randomToken(16);
  return { id, issuedAt: now, value: await signVoterPass(secret, id, now + VOTER_PASS_MS) };
}

/** The voter of a pass that is well formed, unexpired and signed with `secret`, or null. */
export async function verifyVoterPass(
  secret: string,
  value: string,
  now: number,
): Promise<Voter | null> {
  const match = /^([\w-]{1,64})\.(\d{1,15})\.([0-9a-f]{64})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, id = "", expires = "", given = ""] = match;
  const expiresAt = Number(expires);
  if (expiresAt <= now) {
    return null;
  }
  return safeEqual(given, await signature(secret, id, expiresAt))
    ? { id, issuedAt: expiresAt - VOTER_PASS_MS }
    : null;
}
