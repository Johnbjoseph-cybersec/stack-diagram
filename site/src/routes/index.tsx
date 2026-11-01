import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { GalleryPage } from "@/features/gallery/gallery-page.tsx";
import { fetchGallery } from "@/features/gallery/server/gallery.ts";
import { GallerySearch } from "@/features/gallery/utils/search.ts";

const TITLE = "stack-diagram";
const DESCRIPTION = "An agent skill that draws architecture diagrams with official logos.";

export const Route = createFileRoute("/")({
  validateSearch: GallerySearch,
  search: { middlewares: [stripSearchParams({ sort: "top" })] },
  loaderDeps: ({ search: { sort, tech } }) => ({ sort, tech }),
  loader: ({ deps }) => fetchGallery({ data: deps }),
  head: ({ loaderData }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      ...(loaderData
        ? [
            { property: "og:url", content: `${loaderData.siteUrl}/` },
            { property: "og:image", content: `${loaderData.siteUrl}/og/home` },
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  headers: ({ loaderData }) =>
    loaderData ? { "Cache-Control": "public, s-maxage=60" } : undefined,
  component: GalleryPage,
});
