import type { MyPost } from "../server/my-posts.ts";

const count = (n: number, noun: string) => `${n} ${noun}${Math.abs(n) === 1 ? "" : "s"}`;

/** The note after the date; a post an admin hid without reports gets none. */
export function postMeta(post: Pick<MyPost, "status" | "score" | "reports">) {
  if (post.status === "published") {
    return count(post.score, "vote");
  }
  if (post.status === "held") {
    return "Not public yet";
  }
  return post.reports > 0 ? `Hidden after ${count(post.reports, "report")}` : null;
}
