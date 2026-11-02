import type { PublicStack } from "@/lib/public-stack.ts";

import { StackCardSkeleton } from "./stack-card-skeleton.tsx";
import { StackCard } from "./stack-card.tsx";

import styles from "./stack-grid.module.css";

/** Stack cards on the iris band; skeletons hold the place of a page that is loading. */
export function StackGrid({
  stacks,
  skeletons = 0,
}: {
  stacks: PublicStack[];
  skeletons?: number;
}) {
  return (
    <ul className={styles.grid} aria-busy={skeletons > 0 || undefined}>
      {stacks.map((stack) => (
        <li key={stack.id} className={styles.item}>
          <StackCard stack={stack} />
        </li>
      ))}
      {Array.from({ length: skeletons }, (_, index) => (
        <li key={`skeleton-${index}`} className={styles.item} data-skeleton="">
          <StackCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
