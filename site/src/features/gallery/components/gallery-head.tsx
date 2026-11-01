import { ArrowFatUpIcon, ClockIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { FilterChip } from "@/components/filter-chip.tsx";

import type { Sort } from "../server/params.ts";

import styles from "./gallery-head.module.css";

// Without exact, Link counts a chip whose search is a subset of the URL's as current too.
const EXACT = { exact: true };

export function GalleryHead({ sort, tech }: { sort: Sort; tech?: string }) {
  return (
    <div className={styles.head}>
      <div className={styles.title}>
        <h2 id="gallery" className={styles.heading}>
          Gallery
        </h2>
        <p className={styles.description}>Diagrams shared by people who use the skill.</p>
      </div>
      <div role="group" aria-label="Sort" className={styles.sort}>
        <FilterChip
          label="Popular"
          icon={<ArrowFatUpIcon />}
          selected={sort === "top"}
          render={
            <Link to="/" search={{ sort: "top", tech }} resetScroll={false} activeOptions={EXACT} />
          }
        />
        <FilterChip
          label="New"
          icon={<ClockIcon weight="bold" />}
          selected={sort === "new"}
          render={
            <Link to="/" search={{ sort: "new", tech }} resetScroll={false} activeOptions={EXACT} />
          }
        />
      </div>
    </div>
  );
}
