import { Buffer } from "node:buffer";

import { cache, render } from "@cf-wasm/og/workerd";
import { env, waitUntil } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";

import { clientKey } from "@/lib/client-key.ts";
import { getDb } from "@/lib/db/client.ts";
import { stacks } from "@/lib/db/schema.ts";

import { homeImage, OG_SIZE, stackImage } from "./images.tsx";

cache.setExecutionContext({ waitUntil });

const HOME_KEY = "og/home.png";
const HOME_LOCK_KEY = "og/home.lock";
// Short, so a post hidden or deleted from the top three leaves the home image soon.
const HOME_TTL_MS = 10 * 60 * 1000;
const LOCK_MS = 2 * 60 * 1000;

const png = (body: ReadableStream | Uint8Array<ArrayBuffer>) =>
  new Response(body, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=300" },
  });

const notFound = () => new Response("Not found", { status: 404 });

const tooMany = () =>
  new Response("Too many requests", { status: 429, headers: { "Retry-After": "60" } });

const withinReadLimit = async (request: Request) =>
  (await env.READ_LIMITER.limit({ key: await clientKey(request, env.IP_HASH_SECRET) })).success;

// satori cannot read WebP, so OG images use the JPEG preview.
async function previewDataUrl(id: string) {
  const object = await env.BUCKET.get(`stacks/${id}/preview.jpg`);
  if (!object) {
    return null;
  }
  return `data:image/jpeg;base64,${Buffer.from(await object.arrayBuffer()).toString("base64")}`;
}

async function renderPng(key: string, { element, fonts }: ReturnType<typeof homeImage>) {
  const { image } = await render(element, { ...OG_SIZE, fonts }).asPng();
  waitUntil(env.BUCKET.put(key, image, { httpMetadata: { contentType: "image/png" } }));
  return png(image);
}

// Swapping the lock object by etag lets one request refresh the stale image while the rest serve it.
async function claimHomeRefresh() {
  const lock = await env.BUCKET.head(HOME_LOCK_KEY);
  if (lock && Date.now() - lock.uploaded.getTime() < LOCK_MS) {
    return false;
  }
  const claimed = await env.BUCKET.put(
    HOME_LOCK_KEY,
    crypto.randomUUID(),
    lock ? { onlyIf: { etagMatches: lock.etag } } : {},
  );
  return claimed !== null;
}

export async function handleHomeOg(request: Request): Promise<Response> {
  const current = await env.BUCKET.get(HOME_KEY);
  if (current) {
    if (Date.now() - current.uploaded.getTime() < HOME_TTL_MS || !(await claimHomeRefresh())) {
      return png(current.body);
    }
    await current.body.cancel();
  } else if (!(await withinReadLimit(request))) {
    return tooMany();
  }
  const top = await getDb()
    .select({ id: stacks.id })
    .from(stacks)
    .where(eq(stacks.status, "published"))
    .orderBy(desc(stacks.score), desc(stacks.createdAt), desc(stacks.id))
    .limit(3);
  const previews = await Promise.all(top.map(({ id }) => previewDataUrl(id)));
  return renderPng(HOME_KEY, homeImage(previews));
}

export async function handleStackOg(request: Request, id: string): Promise<Response> {
  // Crawlers fetch one image at a time, so the limit can come before the database.
  if (!(await withinReadLimit(request))) {
    return tooMany();
  }
  const [stack] = await getDb()
    .select({ title: stacks.title, name: stacks.name })
    .from(stacks)
    .where(and(eq(stacks.id, id), eq(stacks.status, "published")));
  if (!stack) {
    return notFound();
  }
  const key = `og/${id}.png`;
  const cached = await env.BUCKET.get(key);
  if (cached) {
    return png(cached.body);
  }
  return renderPng(key, stackImage({ ...stack, preview: await previewDataUrl(id) }));
}
