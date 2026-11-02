import { getRouteApi } from "@tanstack/react-router";

import { PageShell } from "@/components/page-shell.tsx";

import { GalleryFeed } from "./components/gallery-feed.tsx";
import { GalleryHead } from "./components/gallery-head.tsx";
import { Hero } from "./components/hero.tsx";
import { TechFilters } from "./components/tech-filters.tsx";

import styles from "./gallery-page.module.css";

const route = getRouteApi("/");

export function GalleryPage() {
  const page = route.useLoaderData();
  const { sort, tech } = route.useSearch();

  return (
    <PageShell active="gallery">
      <Hero />
      <section aria-labelledby="gallery" className={styles.gallery}>
        <GalleryHead sort={sort} tech={tech} />
        <TechFilters techs={page.techs} total={page.total} sort={sort} tech={tech} />
        <GalleryFeed first={page} sort={sort} tech={tech} />
      </section>
    </PageShell>
  );
}
