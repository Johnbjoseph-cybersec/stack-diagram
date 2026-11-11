import { env } from "cloudflare:workers";

import { issueChallenge } from "./pow.ts";
import { intVar } from "./vars.ts";

// 26 is the most share.py solves inside the 10-minute TTL; above it every share.py submit fails.
export const powBits = () => Math.min(intVar(env.POW_BITS, 20), 26);

export async function handleChallenge(_request: Request): Promise<Response> {
  return Response.json(
    { challenge: await issueChallenge(env.POW_SECRET, Date.now()), bits: powBits() },
    { headers: { "cache-control": "no-store" } },
  );
}
