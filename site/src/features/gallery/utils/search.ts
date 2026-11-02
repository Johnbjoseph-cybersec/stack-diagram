import { z } from "zod";

import type { PublicStack } from "@/lib/public-stack.ts";

import { SORTS, type Sort, TECH_PATTERN } from "../server/params.ts";
import type { GalleryPage } from "../server/stacks.ts";

export const PAGE_SIZE = 24;

export const GallerySearch = z.object({
  sort: z.enum(SORTS).default("top").catch("top"),
  tech: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.string().regex(TECH_PATTERN))
    .optional()
    .catch(undefined),
});

export type GallerySearch = z.output<typeof GallerySearch>;

/** One fixed parameter order, so every visitor's page shares one edge-cache key. */
export function listUrl({ sort, tech, cursor }: { sort: Sort; tech?: string; cursor: string }) {
  const params = new URLSearchParams({ sort });
  if (tech !== undefined) {
    params.set("tech", tech);
  }
  params.set("cursor", cursor);
  params.set("limit", String(PAGE_SIZE));
  return `/api/stacks?${params}`;
}

/** Scores move between pages, so a post can show up twice; keep its first place. */
export function appendPage(items: PublicStack[], page: GalleryPage["items"]) {
  const seen = new Set(items.map(({ id }) => id));
  return [...items, ...page.filter(({ id }) => !seen.has(id))];
}
