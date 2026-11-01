import type { SubmissionMode } from "@/lib/settings.ts";

import { fail } from "./http.ts";
import { type Meta, parseMeta } from "./meta.ts";
import { MAX_PNG_BYTES, diagramSize } from "./png.ts";
import { verifyProof } from "./pow.ts";
import { readAtMost } from "./read.ts";

export const MAX_BODY_BYTES = 2.5 * 1024 * 1024;
// In a header so a request without a valid proof is turned away before its body is read.
export const PROOF_HEADER = "x-proof-of-work";

export type Accepted = {
  mode: SubmissionMode;
  meta: Meta;
  light: Uint8Array<ArrayBuffer>;
  dark: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
};

export type IntakeDeps = {
  mode: () => Promise<SubmissionMode>;
  limit: () => Promise<boolean>;
  pow: { secret: string; bits: number; now: number };
  useChallenge: (challenge: string) => Promise<boolean>;
  postsToday: () => Promise<{ total: number; mine: number }>;
  dailyLimit: number;
  dailyLimitPerIp: number;
  publish: (post: Accepted) => Promise<Response>;
};

const bytesOf = async (file: File) => new Uint8Array(await file.arrayBuffer());

/** Runs every cheap check, cheapest first, and hands only a post that passes them all to `publish`. */
export async function intake(request: Request, deps: IntakeDeps): Promise<Response> {
  if (!(await deps.limit())) {
    return fail(429, "Too many posts. Try again in a minute");
  }
  const mode = await deps.mode();
  if (mode === "closed") {
    return fail(503, "The gallery is not taking posts right now");
  }
  const declared = request.headers.get("content-length");
  if (declared === null) {
    return fail(411, "Send a Content-Length header");
  }
  if (Number(declared) > MAX_BODY_BYTES) {
    return fail(413, "The upload must be at most 2.5 MB");
  }

  const proof = await verifyProof(
    deps.pow.secret,
    request.headers.get(PROOF_HEADER) ?? "",
    deps.pow.bits,
    deps.pow.now,
  );
  if (!proof.ok) {
    return fail(400, proof.error);
  }
  const today = await deps.postsToday();
  if (today.total >= deps.dailyLimit) {
    return fail(429, "The gallery has taken all the posts it can today. Try again tomorrow (UTC)");
  }
  if (today.mine >= deps.dailyLimitPerIp) {
    return fail(429, "You have reached today's post limit. Try again tomorrow (UTC)");
  }
  if (!(await deps.useChallenge(proof.challenge))) {
    return fail(409, "This challenge was already used. Run share again");
  }

  if (!request.body) {
    return fail(400, "Send the post as multipart form data");
  }
  // Content-Length is only the client's word; the cap holds whatever it said.
  const body = await readAtMost(request.body, MAX_BODY_BYTES);
  if (!body) {
    return fail(413, "The upload must be at most 2.5 MB");
  }
  const form = await new Response(body, {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  })
    .formData()
    .catch(() => null);
  if (!form) {
    return fail(400, "Send the post as multipart form data");
  }

  const parsed = parseMeta(form.get("meta"));
  if (!parsed.ok) {
    return fail(400, parsed.error);
  }
  const lightFile = form.get("light");
  const darkFile = form.get("dark");
  if (!(lightFile instanceof File) || !(darkFile instanceof File)) {
    return fail(400, "Attach the light and dark PNGs");
  }
  if (lightFile.size > MAX_PNG_BYTES || darkFile.size > MAX_PNG_BYTES) {
    return fail(413, "Each PNG must be at most 1 MB");
  }
  const [light, dark] = await Promise.all([bytesOf(lightFile), bytesOf(darkFile)]);
  const size = diagramSize(light, dark);
  if (!size.ok) {
    return fail(size.status, size.error);
  }

  return deps.publish({
    mode,
    meta: parsed.meta,
    light,
    dark,
    width: size.width,
    height: size.height,
  });
}
