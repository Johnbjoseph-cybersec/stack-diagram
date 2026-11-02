import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "@/features/admin/admin-page.tsx";
import { TABS, type Tab } from "@/features/admin/moderation.ts";
import { fetchAdminOverview } from "@/features/admin/server/overview.ts";
import { fetchAdminQueue } from "@/features/admin/server/queue.ts";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: TABS.find((tab) => tab === search.tab) ?? "queue",
  }),
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  // Both reads throw notFound for anyone but an admin, so the page answers like an unknown URL.
  loader: async ({ deps }) => {
    const [overview, queue] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminQueue({ data: { tab: deps.tab } }),
    ]);
    return { overview, queue };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: "Admin · stack-diagram" },
          { name: "description", content: "Review held and reported posts." },
          { property: "og:image", content: `${loaderData.overview.siteUrl}/og/home` },
          { name: "robots", content: "noindex" },
        ]
      : [],
  }),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: AdminPage,
});
