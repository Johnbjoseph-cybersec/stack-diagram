import { ArrowFatUpIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format.ts";
import type { PublicStack } from "@/lib/public-stack.ts";

import { TechChip } from "./tech-chip.tsx";
import { VisuallyHidden } from "./visually-hidden.tsx";

import styles from "./stack-card.module.css";

export function StackCard({ stack }: { stack: PublicStack }) {
  return (
    <Link to="/s/$id" params={{ id: stack.id }} className={styles.card}>
      <div className={styles.shot}>
        <img
          src={stack.images.light}
          alt=""
          width={stack.width}
          height={stack.height}
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.who}>
            <span className={styles.name}>{stack.name}</span>
            <time dateTime={stack.createdAt}>{formatDate(stack.createdAt)}</time>
          </span>
          <span className={styles.score}>
            <ArrowFatUpIcon aria-hidden />
            {stack.score}
            <VisuallyHidden> votes</VisuallyHidden>
          </span>
        </div>
        <h3 className={styles.title}>{stack.title}</h3>
        <ul className={styles.stack}>
          {stack.stack.map((item, index) => (
            <li key={`${index}-${item.name}`}>
              <TechChip item={item} />
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
