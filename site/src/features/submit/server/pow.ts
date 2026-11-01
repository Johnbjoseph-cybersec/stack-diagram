import { hmac, randomToken, safeEqual, sha256Bytes } from "@/lib/crypto.ts";

export const CHALLENGE_TTL = 10 * 60 * 1000;

const PROOF = /^(\d{1,15})\.([\w-]{1,64})\.([0-9a-f]{64}):\d{1,20}$/;

export type ProofCheck = { ok: true; challenge: string } | { ok: false; error: string };

export async function issueChallenge(secret: string, now: number) {
  const payload = `${now}.${randomToken(16)}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export function leadingZeroBits(bytes: Uint8Array) {
  let bits = 0;
  for (const byte of bytes) {
    if (byte !== 0) {
      return bits + Math.clz32(byte) - 24;
    }
    bits += 8;
  }
  return bits;
}

export async function verifyProof(
  secret: string,
  proof: string,
  bits: number,
  now: number,
): Promise<ProofCheck> {
  const match = PROOF.exec(proof);
  if (!match) {
    return { ok: false, error: "The proof of work is malformed" };
  }
  const [, issuedAt = "", random = "", signature = ""] = match;
  if (!safeEqual(await hmac(secret, `${issuedAt}.${random}`), signature)) {
    return { ok: false, error: "The challenge is not one this gallery issued" };
  }
  if (now - Number(issuedAt) > CHALLENGE_TTL) {
    return { ok: false, error: "The challenge expired. Run share again" };
  }
  if (leadingZeroBits(await sha256Bytes(proof)) < bits) {
    return { ok: false, error: "The proof of work does not meet the difficulty" };
  }
  return { ok: true, challenge: `${issuedAt}.${random}.${signature}` };
}
