import { env } from "cloudflare:workers";

import { issueChallenge } from "./pow.ts";
import { intVar } from "./vars.ts";

// share.py refuses more than 32 bits.
export const powBits = () => Math.min(intVar(env.POW_BITS, 20), 32);

export async function handleChallenge(_request: Request): Promise<Response> {
  return Response.json(
    { challenge: await issueChallenge(env.POW_SECRET, Date.now()), bits: powBits() },
    { headers: { "cache-control": "no-store" } },
  );
}
