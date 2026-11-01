import { getRouteApi, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/button.tsx";
import { FilterChip } from "@/components/filter-chip.tsx";
import { PageShell } from "@/components/page-shell.tsx";
import { SectionBand } from "@/components/section-band.tsx";
import { errorText } from "@/lib/error-text.ts";

import { ModeSwitch } from "./components/mode-switch.tsx";
import { ModerationRow } from "./components/moderation-row.tsx";
import { TABS, type Tab } from "./moderation.ts";
import { type AdminItem, fetchAdminQueue, type QueueCursor } from "./server/queue.ts";

import styles from "./admin-page.module.css";

const route = getRouteApi("/admin");

const TAB_LABELS: Record<Tab, string> = {
  queue: "Queue",
  hidden: "Hidden",
  published: "Published",
};

type QueuePage = { items: AdminItem[]; nextCursor: QueueCursor | null };

function Queue({ tab, first }: { tab: Tab; first: QueuePage }) {
  // Pages past the first belong to the load they followed; a reload after an action starts over.
  const [more, setMore] = useState<(QueuePage & { after: QueuePage }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const extra = more?.after === first ? more : null;
  const items = extra ? [...first.items, ...extra.items] : first.items;
  const nextCursor = extra ? extra.nextCursor : first.nextCursor;

  const loadMore = async (cursor: QueueCursor) => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchAdminQueue({ data: { tab, cursor } });
      setMore({
        after: first,
        items: [...(extra?.items ?? []), ...page.items],
        nextCursor: page.nextCursor,
      });
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.posts}>
      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <ModerationRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No posts yet.</p>
      )}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {nextCursor ? (
        <Button
          variant="tonal"
          disabled={loading}
          className={styles.more}
          onClick={() => void loadMore(nextCursor)}
        >
          Load more
        </Button>
      ) : null}
    </div>
  );
}

export function AdminPage() {
  const { overview, queue } = route.useLoaderData();
  const { tab } = route.useSearch();

  return (
    <PageShell>
      <SectionBand title="Admin" description="Review held and reported posts." />
      <div className={styles.controls}>
        <ModeSwitch mode={overview.mode} />
        <p className={styles.today}>
          Today
          <span className={styles.figure}>
            {overview.today} / {overview.dailyLimit}
          </span>
        </p>
      </div>
      <div className={styles.tabs}>
        {TABS.map((value) => (
          <FilterChip
            key={value}
            label={TAB_LABELS[value]}
            count={overview.counts[value]}
            selected={value === tab}
            render={<Link to="/admin" search={{ tab: value }} />}
          />
        ))}
      </div>
      <Queue key={tab} tab={tab} first={queue} />
    </PageShell>
  );
}
