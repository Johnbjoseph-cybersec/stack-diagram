import type { STATUSES } from "@/lib/db/schema.ts";

export type Status = (typeof STATUSES)[number];

export const TABS = ["queue", "hidden", "published"] as const;
export type Tab = (typeof TABS)[number];

export const ACTIONS = ["publish", "keep", "hide", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

type Post = { status: Status; reports: number };

const allowed: Record<Action, (post: Post) => boolean> = {
  publish: (post) => post.status !== "published",
  keep: (post) => post.status === "published" && post.reports > 0,
  // Hiding a post that reports hid confirms the reports and takes it off the queue.
  hide: (post) => post.status !== "hidden" || post.reports > 0,
  delete: () => true,
};

export const canModerate = (post: Post, action: Action) => allowed[action](post);
