import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, arrayOverlaps, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { clientKey } from "@/lib/client-key.ts";
import { type Db, getDb } from "@/lib/db/client.ts";
import { stacks, votes } from "@/lib/db/schema.ts";
import { toPublicStack } from "@/lib/public-stack.ts";

import { httpError, stackId, strictInput } from "./input.ts";
import { toVote, type Vote } from "./rules.ts";
import { readVoter, voterHash } from "./voter.ts";

async function relatedStacks(db: Db, stack: typeof stacks.$inferSelect) {
  if (stack.stackKeys.length === 0) {
    return [];
  }
  const keys = sql`array[${sql.join(
    stack.stackKeys.map((key) => sql`${key}`),
    sql`, `,
  )}]::text[]`;
  const shared = sql`cardinality(array(select unnest(${stacks.stackKeys}) intersect select unnest(${keys})))`;
  return db
    .select()
    .from(stacks)
    .where(
      and(
        eq(stacks.status, "published"),
        ne(stacks.id, stack.id),
        arrayOverlaps(stacks.stackKeys, keys),
      ),
    )
    .orderBy(desc(shared), desc(stacks.createdAt))
    .limit(3);
}

async function voteOf(db: Db, id: string, voterId: string | null): Promise<Vote> {
  if (!voterId) {
    return 0;
  }
  const [vote] = await db
    .select({ value: votes.value })
    .from(votes)
    .where(and(eq(votes.stackId, id), eq(votes.voterHash, await voterHash(voterId))));
  return toVote(vote?.value ?? 0);
}

// myVote and hasVoterPass come only from the voter cookie, so pages without one can be edge-cached.
export const fetchStack = createServerFn({ method: "GET" })
  .validator(strictInput(z.strictObject({ id: stackId })))
  .handler(async ({ data }) => {
    const { success } = await env.READ_LIMITER.limit({
      key: await clientKey(getRequest(), env.IP_HASH_SECRET),
    });
    if (!success) {
      throw httpError(429, "Too many requests");
    }
    const db = getDb();
    const [stack] = await db
      .select()
      .from(stacks)
      .where(and(eq(stacks.id, data.id), eq(stacks.status, "published")));
    if (!stack) {
      throw notFound();
    }
    const voter = await readVoter();
    const [related, myVote] = await Promise.all([
      relatedStacks(db, stack),
      voteOf(db, stack.id, voter?.id ?? null),
    ]);
    const turnstileSiteKey: string = env.TURNSTILE_SITE_KEY;
    const siteUrl: string = env.SITE_URL;
    return {
      stack: toPublicStack(stack),
      related: related.map(toPublicStack),
      myVote,
      turnstileSiteKey,
      hasVoterPass: voter !== null,
      siteUrl,
    };
  });
