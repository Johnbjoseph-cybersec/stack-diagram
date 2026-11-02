import { env } from "cloudflare:workers";
import { and, eq, or, sql } from "drizzle-orm";

import { getViewer } from "@/lib/auth.ts";
import { clientKey } from "@/lib/client-key.ts";
import { getDb } from "@/lib/db/client.ts";
import { stacks } from "@/lib/db/schema.ts";

import { fail } from "./http.ts";
import { STACK_ID } from "./stack-id.ts";

const ICON_KEY = /^icons\/[0-9a-f]{64}\.(?:svg|png|webp)$/;
const STACK_IMAGE_KEY = /^stacks\/([^/]+)\/(?:light|dark)\.webp$/;
// Short, so a hidden post or an icon no post uses stops showing within minutes everywhere.
const PUBLIC_CACHE = "public, max-age=300, s-maxage=300";

const notFound = () => fail(404, "Not found");

const serve = (object: R2ObjectBody, headers: Record<string, string>) =>
  new Response(object.body, {
    headers: {
      ...headers,
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    },
  });

async function isIconPublished(key: string) {
  const references = (field: "iconKey" | "iconDarkKey") =>
    sql`${stacks.stack} @> ${JSON.stringify([{ [field]: key }])}::jsonb`;
  const [row] = await getDb()
    .select({ id: stacks.id })
    .from(stacks)
    .where(
      and(eq(stacks.status, "published"), or(references("iconKey"), references("iconDarkKey"))),
    )
    .limit(1);
  return row !== undefined;
}

async function canSeeUnpublished(request: Request, githubId: string | null) {
  // Only owners and admins get here, so the limit costs them nothing and caps forged session cookies.
  const ip = await clientKey(request, env.IP_HASH_SECRET);
  if (!(await env.READ_LIMITER.limit({ key: ip })).success) {
    return false;
  }
  const viewer = await getViewer(request);
  return viewer !== null && (viewer.isAdmin || viewer.githubId === githubId);
}

/** Icons only while a published post uses them, so the bucket is no free host. R2 is read first, so a made-up key never reaches the database. */
export async function handleFile(request: Request, key: string): Promise<Response> {
  const id = STACK_IMAGE_KEY.exec(key)?.[1];
  if (!ICON_KEY.test(key) && !(id && STACK_ID.test(id))) {
    return notFound();
  }
  const object = await env.BUCKET.get(key);
  if (!object) {
    return notFound();
  }
  if (!id) {
    if (!(await isIconPublished(key))) {
      await object.body.cancel();
      return notFound();
    }
    return serve(object, {
      "cache-control": PUBLIC_CACHE,
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    });
  }
  const [row] = await getDb()
    .select({ status: stacks.status, githubId: stacks.githubId })
    .from(stacks)
    .where(eq(stacks.id, id));
  if (row?.status === "published") {
    return serve(object, { "cache-control": PUBLIC_CACHE });
  }
  if (row && (await canSeeUnpublished(request, row.githubId))) {
    return serve(object, { "cache-control": "private, no-store" });
  }
  await object.body.cancel();
  return notFound();
}
