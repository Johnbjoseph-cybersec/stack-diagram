import { ArrowSquareOutIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { z } from "zod";

import { Button, buttonClass } from "@/components/button.tsx";
import { StackGrid } from "@/components/stack-grid.tsx";
import { errorText } from "@/lib/error-text.ts";

import type { Sort } from "../server/params.ts";
import type { GalleryPage } from "../server/stacks.ts";
import { appendPage, listUrl } from "../utils/search.ts";

import styles from "./gallery-feed.module.css";

const COLUMNS = 3;
const ErrorBody = z.object({ error: z.string() });

async function fetchPage(url: string): Promise<GalleryPage> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = ErrorBody.safeParse(await response.json().catch(() => null));
    throw new Error(body.success ? body.data.error : response.statusText);
  }
  return response.json();
}

type Feed = {
  key: string;
  first: GalleryPage;
  items: GalleryPage["items"];
  cursor: string | null;
};

// Feeds that grew past the first page, per sort and tech, so Back returns to the same place.
const loaded = new Map<string, Feed>();

const feedFor = (key: string, first: GalleryPage): Feed =>
  loaded.get(key) ?? { key, first, items: first.items, cursor: first.nextCursor };

/** The first page comes from the loader; the rest load from the edge-cached list API as the end nears. */
export function GalleryFeed({
  first,
  sort,
  tech,
}: {
  first: GalleryPage;
  sort: Sort;
  tech?: string;
}) {
  const key = `${sort}|${tech ?? ""}`;
  const [feed, setFeed] = useState(() => feedFor(key, first));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  if (feed.key !== key || (feed.first !== first && !loaded.has(key))) {
    setFeed(feedFor(key, first));
    setError(null);
  }

  const loadMore = useEffectEvent(async () => {
    const base = feed;
    if (busy.current || base.cursor === null) return;
    busy.current = true;
    setLoading(true);
    try {
      const page = await fetchPage(listUrl({ sort, tech, cursor: base.cursor }));
      const next = { ...base, items: appendPage(base.items, page.items), cursor: page.nextCursor };
      loaded.set(base.key, next);
      setFeed((current) => (current.key === base.key ? next : current));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  });

  useEffect(() => {
    const node = sentinel.current;
    if (!node || feed.cursor === null || error !== null) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "0px 0px 800px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [feed.cursor, error]);

  if (feed.items.length === 0) {
    return tech === undefined ? (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No diagrams yet.</p>
        <Link to="/share" className={buttonClass({ variant: "tonal" })}>
          <ArrowSquareOutIcon weight="bold" aria-hidden />
          Share a diagram
        </Link>
      </div>
    ) : (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No diagrams use this yet.</p>
        <Link
          to="/"
          search={{ sort }}
          resetScroll={false}
          className={buttonClass({ variant: "tonal" })}
        >
          All diagrams
        </Link>
      </div>
    );
  }

  return (
    <>
      <StackGrid
        stacks={feed.items}
        skeletons={loading ? COLUMNS - (feed.items.length % COLUMNS) : 0}
      />
      <div ref={sentinel} />
      {loading ? (
        <p role="status" className={styles.status}>
          <SpinnerIcon className={styles.spinner} aria-hidden />
          Loading…
        </p>
      ) : null}
      {error === null ? null : (
        <div className={styles.status}>
          <p role="alert">{error}</p>
          <Button variant="tonal" onClick={() => setError(null)}>
            Try again
          </Button>
        </div>
      )}
    </>
  );
}
