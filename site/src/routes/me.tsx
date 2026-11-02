import { createFileRoute } from "@tanstack/react-router";

import { MyPostsPage } from "@/features/account/my-posts-page.tsx";
import { fetchMyPosts } from "@/features/account/server/my-posts.ts";

export const Route = createFileRoute("/me")({
  loader: () => fetchMyPosts(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "My posts · stack-diagram" },
      {
        name: "description",
        content: "Posts shared with your GitHub login. You can delete them here.",
      },
      { property: "og:image", content: `${loaderData?.siteUrl ?? ""}/og/home` },
      { name: "robots", content: "noindex" },
    ],
  }),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: MyPostsPage,
});
