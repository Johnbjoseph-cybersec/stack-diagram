import { Link } from "@tanstack/react-router";

import { FilterChip } from "@/components/filter-chip.tsx";

import type { Sort } from "../server/params.ts";
import type { TechCount } from "../server/stacks.ts";

import styles from "./tech-filters.module.css";

// Without exact, Link counts a chip whose search is a subset of the URL's as current too.
const EXACT = { exact: true };

export function TechFilters({
  techs,
  total,
  sort,
  tech,
}: {
  techs: TechCount[];
  total: number;
  sort: Sort;
  tech?: string;
}) {
  return (
    <ul aria-label="Tech" className={styles.filters}>
      <li className={styles.item}>
        <FilterChip
          label="All"
          count={total}
          selected={tech === undefined}
          render={<Link to="/" search={{ sort }} resetScroll={false} activeOptions={EXACT} />}
        />
      </li>
      {techs.map(({ key, name, count, icon, wide }) => (
        <li key={key} className={styles.item}>
          <FilterChip
            label={name}
            count={count}
            logo={icon}
            wide={wide}
            selected={tech === key}
            render={
              <Link to="/" search={{ sort, tech: key }} resetScroll={false} activeOptions={EXACT} />
            }
          />
        </li>
      ))}
    </ul>
  );
}
