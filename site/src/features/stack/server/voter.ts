import { getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { clientKey } from "@/lib/client-key.ts";
import { hmac } from "@/lib/crypto.ts";

import { httpError } from "./input.ts";
import {
  issueVoterPass,
  type Voter,
  VOTER_COOKIE,
  VOTER_PASS_MS,
  verifyVoterPass,
} from "./voter-pass.ts";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SiteverifyResult = z.object({ success: z.boolean() });

export async function readVoter() {
  const value = getCookie(VOTER_COOKIE);
  return value ? verifyVoterPass(env.POW_SECRET, value, Date.now()) : null;
}

async function passesTurnstile(request: Request, token: string) {
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) {
    body.set("remoteip", ip);
  }
  const response = await fetch(SITEVERIFY, { method: "POST", body });
  if (!response.ok) {
    return false;
  }
  const result = SiteverifyResult.safeParse(await response.json());
  return result.success && result.data.success;
}

/** The voter from the cookie, or from a new cookie once the Turnstile token checks out; null means show the challenge. */
export async function requireVoter(
  request: Request,
  token: string | undefined,
): Promise<Voter | null> {
  const voter = await readVoter();
  if (voter || !token || !(await passesTurnstile(request, token))) {
    return voter;
  }
  const pass = await issueVoterPass(env.POW_SECRET, Date.now());
  setCookie(VOTER_COOKIE, pass.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: VOTER_PASS_MS / 1000,
  });
  return { id: pass.id, issuedAt: pass.issuedAt };
}

/** Hashed so raw voter ids never reach the database. */
export const voterHash = (voterId: string) => hmac(env.IP_HASH_SECRET, `voter:${voterId}`);

export async function limitActions(request: Request) {
  const ip = await clientKey(request, env.IP_HASH_SECRET);
  const { success } = await env.ACTION_LIMITER.limit({ key: ip });
  if (!success) {
    throw httpError(429, "Too many requests. Try again in a minute.");
  }
  return ip;
}
