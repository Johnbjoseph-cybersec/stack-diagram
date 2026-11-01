import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq, gt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";

import { type Db, getDb } from "@/lib/db/client.ts";
import { stacks, votes } from "@/lib/db/schema.ts";

import { httpError, stackId, strictInput, turnstileToken } from "./input.ts";
import { type Vote, type VoteCounts, voteLimitError } from "./rules.ts";
import { limitActions, requireVoter, voterHash } from "./voter.ts";

const VoteInput = z.strictObject({
  id: stackId,
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  turnstileToken: turnstileToken.optional(),
});

async function voteCounts(db: Db, id: string, voter: string, ip: string): Promise<VoteCounts> {
  const [counts] = await db
    .select({
      voterDay: sql<number>`(count(*) filter (where ${votes.voterHash} = ${voter}))::int`,
      networkDay: sql<number>`(count(*) filter (where ${votes.ipHash} = ${ip}))::int`,
      networkPostDay: sql<number>`(count(*) filter (where ${votes.ipHash} = ${ip} and ${votes.stackId} = ${id}))::int`,
    })
    .from(votes)
    .where(
      and(
        gt(votes.createdAt, sql`now() - interval '1 day'`),
        or(eq(votes.voterHash, voter), eq(votes.ipHash, ip)),
        or(ne(votes.stackId, id), ne(votes.voterHash, voter)),
      ),
    );
  return counts ?? { voterDay: 0, networkDay: 0, networkPostDay: 0 };
}

export const castVote = createServerFn({ method: "POST" })
  .validator(strictInput(VoteInput))
  .handler(async ({ data }): Promise<{ needsChallenge: true } | { score: number; vote: Vote }> => {
    const request = getRequest();
    const ip = await limitActions(request);
    const pass = await requireVoter(request, data.turnstileToken);
    if (!pass) {
      return { needsChallenge: true };
    }
    const voter = await voterHash(pass.id);
    const db = getDb();
    const [stack] = await db
      .select({ id: stacks.id })
      .from(stacks)
      .where(and(eq(stacks.id, data.id), eq(stacks.status, "published")));
    if (!stack) {
      throw httpError(404, "This diagram is no longer here.");
    }
    if (data.value !== 0) {
      const error = voteLimitError(await voteCounts(db, stack.id, voter, ip));
      if (error) {
        throw httpError(429, error);
      }
    }
    const mine = and(eq(votes.stackId, stack.id), eq(votes.voterHash, voter));
    const write =
      data.value === 0
        ? db.delete(votes).where(mine)
        : db
            .insert(votes)
            .values({ stackId: stack.id, voterHash: voter, ipHash: ip, value: data.value })
            .onConflictDoUpdate({
              target: [votes.stackId, votes.voterHash],
              set: { value: data.value },
            });
    // The row lock queues votes on one post, so each total includes every vote committed before it.
    const [, , [updated]] = await db.batch([
      db.select({ id: stacks.id }).from(stacks).where(eq(stacks.id, stack.id)).for("update"),
      write,
      db
        .update(stacks)
        .set({
          score: sql`(select coalesce(sum(${votes.value}), 0) from ${votes} where ${votes.stackId} = ${stack.id})::int`,
        })
        .where(eq(stacks.id, stack.id))
        .returning({ score: stacks.score }),
    ]);
    return { score: updated?.score ?? 0, vote: data.value };
  });
