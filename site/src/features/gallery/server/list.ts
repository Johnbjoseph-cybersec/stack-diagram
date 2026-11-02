import { env } from "cloudflare:workers";

import { clientKey } from "@/lib/client-key.ts";
import { getDb } from "@/lib/db/client.ts";

import { parseListQuery } from "./params.ts";
import { listStacks, topTechs } from "./stacks.ts";

export async function handleList(request: Request): Promise<Response> {
  const query = parseListQuery(new URL(request.url).searchParams);
  if (!query) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }
  const { success } = await env.READ_LIMITER.limit({
    key: await clientKey(request, env.IP_HASH_SECRET),
  });
  if (!success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  const db = getDb();
  const [page, techs] = await Promise.all([
    listStacks(db, query),
    query.include === "techs" ? topTechs(db) : null,
  ]);
  return Response.json(techs ? { ...page, ...techs } : page, {
    headers: { "Cache-Control": "public, s-maxage=60" },
  });
}
