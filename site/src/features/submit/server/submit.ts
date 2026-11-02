import { env } from "cloudflare:workers";
import { count, gte, lt, sql } from "drizzle-orm";

import { clientKey } from "@/lib/client-key.ts";
import { randomToken, sha256 } from "@/lib/crypto.ts";
import { type Db, getDb } from "@/lib/db/client.ts";
import { stacks, usedChallenges } from "@/lib/db/schema.ts";
import { stackImageKey } from "@/lib/public-stack.ts";
import { getSubmissionMode } from "@/lib/settings.ts";
import { deleteStackFiles } from "@/lib/storage.ts";

import { powBits } from "./challenge.ts";
import { lookUpGitHubId } from "./github.ts";
import { catchErrors, fail } from "./http.ts";
import { storeIcons } from "./icons.ts";
import { type Accepted, intake } from "./intake.ts";
import { classify, decide } from "./moderation.ts";
import { newStackId } from "./stack-id.ts";
import { intVar } from "./vars.ts";

const WEBP_QUALITY = 80;
const PREVIEW_WIDTH = 1200;
const PREVIEW_QUALITY = 80;
const DAY = 24 * 60 * 60 * 1000;

// Rows a day old belong to long-expired challenges, so each use sweeps them.
async function useChallenge(db: Db, challenge: string, ipHash: string) {
  const [, inserted] = await db.batch([
    db.delete(usedChallenges).where(lt(usedChallenges.createdAt, new Date(Date.now() - DAY))),
    db
      .insert(usedChallenges)
      .values({ hash: await sha256(challenge), ipHash })
      .onConflictDoNothing()
      .returning({ hash: usedChallenges.hash }),
  ]);
  return inserted.length > 0;
}

// Spent proofs, not posts, so deleting a post or failing to publish one never frees a slot.
async function postsToday(db: Db, ipHash: string) {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [row] = await db
    .select({
      total: count(),
      mine: sql<number>`count(*) filter (where ${usedChallenges.ipHash} = ${ipHash})`.mapWith(
        Number,
      ),
    })
    .from(usedChallenges)
    .where(gte(usedChallenges.createdAt, dayStart));
  return row ?? { total: 0, mine: 0 };
}

async function encode(pending: Promise<ImageTransformationResult>) {
  const result = await pending;
  return { body: await result.response().arrayBuffer(), contentType: result.contentType() };
}

const input = (png: Uint8Array<ArrayBuffer>) => env.IMAGES.input(new Blob([png]).stream());

const preview = (png: Uint8Array<ArrayBuffer>, background: string) =>
  encode(
    input(png)
      .transform({ width: PREVIEW_WIDTH, fit: "scale-down" })
      .output({ format: "image/jpeg", quality: PREVIEW_QUALITY, background, anim: false }),
  );

// AVIF output stops at 1200px a side, and diagrams are rendered at 2x for zooming, so WebP keeps full size.
async function encodeImages(light: Uint8Array<ArrayBuffer>, dark: Uint8Array<ArrayBuffer>) {
  const [lightImage, darkImage, lightPreview, darkPreview] = await Promise.all([
    encode(input(light).output({ format: "image/webp", quality: WEBP_QUALITY, anim: false })),
    encode(input(dark).output({ format: "image/webp", quality: WEBP_QUALITY, anim: false })),
    preview(light, "#ffffff"),
    preview(dark, "#000000"),
  ]);
  return { light: lightImage, dark: darkImage, preview: lightPreview, darkPreview };
}

async function publish(db: Db, ipHash: string, post: Accepted) {
  const { meta } = post;
  const [images, githubId, stack] = await Promise.all([
    encodeImages(post.light, post.dark).catch((error: unknown) => {
      console.error("Images failed", error);
      return null;
    }),
    meta.github ? lookUpGitHubId(meta.github, env.GITHUB_TOKEN) : null,
    storeIcons(env.BUCKET, meta.stack),
  ]);
  if (!images) {
    return fail(400, "Could not read the PNGs");
  }
  const previews = {
    light: new Uint8Array(images.preview.body),
    dark: new Uint8Array(images.darkPreview.body),
  };
  const scores = await classify(env.AI, env.AI_GATEWAY, previews, {
    title: meta.title,
    name: meta.name,
    stack: meta.stack.map((item) => item.name),
  });
  const status = decide(post.mode, scores);

  const id = newStackId();
  const deleteKey = randomToken(24);
  await Promise.all([
    env.BUCKET.put(stackImageKey(id, "light"), images.light.body, {
      httpMetadata: { contentType: images.light.contentType },
    }),
    env.BUCKET.put(stackImageKey(id, "dark"), images.dark.body, {
      httpMetadata: { contentType: images.dark.contentType },
    }),
    env.BUCKET.put(`stacks/${id}/preview.jpg`, images.preview.body, {
      httpMetadata: { contentType: images.preview.contentType },
    }),
  ]);
  try {
    await db.insert(stacks).values({
      id,
      title: meta.title,
      stack,
      stackKeys: meta.stack.map((item) => item.name.toLowerCase()),
      name: meta.name,
      githubLogin: meta.github ?? null,
      githubId,
      status,
      scores,
      width: post.width,
      height: post.height,
      deleteKeyHash: await sha256(deleteKey),
      ipHash,
    });
  } catch (error) {
    await deleteStackFiles(env.BUCKET, id);
    throw error;
  }
  return Response.json({ id, url: `${env.SITE_URL}/s/${id}`, status, deleteKey }, { status: 201 });
}

export async function handleSubmit(request: Request): Promise<Response> {
  return catchErrors(async () => {
    const db = getDb();
    const ipHash = await clientKey(request, env.IP_HASH_SECRET);
    return intake(request, {
      mode: () => getSubmissionMode(db),
      limit: async () => (await env.SUBMIT_LIMITER.limit({ key: ipHash })).success,
      pow: { secret: env.POW_SECRET, bits: powBits(), now: Date.now() },
      useChallenge: (challenge) => useChallenge(db, challenge, ipHash),
      postsToday: () => postsToday(db, ipHash),
      dailyLimit: intVar(env.DAILY_LIMIT, 200),
      dailyLimitPerIp: intVar(env.DAILY_LIMIT_PER_IP, 5),
      publish: (post) => publish(db, ipHash, post),
    });
  });
}
