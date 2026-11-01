import { createFileRoute } from "@tanstack/react-router";

import { fetchSiteUrl } from "@/features/share-guide/server/site-url.ts";
import { ShareGuidePage } from "@/features/share-guide/share-guide-page.tsx";

export const Route = createFileRoute("/share")({
  loader: () => fetchSiteUrl(),
  staleTime: Infinity,
  head: ({ loaderData }) => ({
    meta: [
      { title: "Share a diagram · stack-diagram" },
      { name: "description", content: "Post a diagram you drew with the skill to the gallery." },
      { property: "og:image", content: `${loaderData ?? ""}/og/home` },
    ],
  }),
  headers: () => ({ "Cache-Control": "public, s-maxage=300" }),
  component: ShareGuidePage,
});
