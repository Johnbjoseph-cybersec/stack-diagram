import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getViewer, httpError, requireViewer } from "@/lib/auth.ts";
import { getDb } from "@/lib/db/client.ts";
import { type STATUSES, stacks } from "@/lib/db/schema.ts";
import { type PublicStack, toPublicStack } from "@/lib/public-stack.ts";
import { deleteStackFiles } from "@/lib/storage.ts";

import { ownsPost } from "./ownership.ts";

export type MyPost = PublicStack & { status: (typeof STATUSES)[number]; reports: number };

export type MyPosts = {
  viewer: { login: string | null; name: string; image: string | null } | null;
  posts: MyPost[];
  siteUrl: string;
};

export const fetchMyPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<MyPosts> => {
    const viewer = await getViewer(getRequest());
    if (!viewer) {
      return { viewer: null, posts: [], siteUrl: env.SITE_URL };
    }
    const rows = await getDb()
      .select()
      .from(stacks)
      .where(eq(stacks.githubId, viewer.githubId))
      .orderBy(desc(stacks.createdAt));
    return {
      viewer: { login: viewer.login, name: viewer.name, image: viewer.image },
      posts: rows.map((row) => ({
        ...toPublicStack(row),
        status: row.status,
        reports: row.reports,
      })),
      siteUrl: env.SITE_URL,
    };
  },
);

export const deleteMyPost = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const viewer = await requireViewer();
    const db = getDb();
    const [post] = await db
      .select({ githubId: stacks.githubId })
      .from(stacks)
      .where(eq(stacks.id, data.id));
    if (!post) {
      throw httpError(404, "This post no longer exists.");
    }
    if (!ownsPost(post, viewer)) {
      throw httpError(403, "You can only delete your own posts.");
    }
    await db.delete(stacks).where(eq(stacks.id, data.id));
    await deleteStackFiles(env.BUCKET, data.id);
    return { ok: true };
  });
