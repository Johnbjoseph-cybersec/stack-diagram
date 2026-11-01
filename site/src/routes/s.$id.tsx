import { createFileRoute, notFound } from "@tanstack/react-router";

import { PageMessage } from "@/components/page-message.tsx";
import { stackId } from "@/features/stack/server/input.ts";
import { fetchStack } from "@/features/stack/server/stack.ts";
import { StackPage } from "@/features/stack/stack-page.tsx";

export const Route = createFileRoute("/s/$id")({
  loader: ({ params: { id } }) => {
    if (!stackId.safeParse(id).success) {
      throw notFound();
    }
    return fetchStack({ data: { id } });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }
    const { stack, siteUrl } = loaderData;
    const title = `${stack.title} · stack-diagram`;
    return {
      meta: [
        { title },
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${siteUrl}/s/${stack.id}` },
        { property: "og:image", content: `${siteUrl}/og/s/${stack.id}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  // The voter's own vote is in the page, so only pages without a voter pass may be shared.
  headers: ({ loaderData }) =>
    loaderData
      ? {
          "Cache-Control": loaderData.hasVoterPass ? "private, no-store" : "public, s-maxage=60",
        }
      : undefined,
  notFoundComponent: () => <PageMessage message="This diagram isn't here." />,
  component: StackPage,
});
