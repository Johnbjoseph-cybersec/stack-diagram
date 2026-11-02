import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

import { formatDate } from "@/lib/format.ts";
import type { PublicStack, Theme } from "@/lib/public-stack.ts";

import { StatusBadge } from "./status-badge.tsx";

import styles from "./stack-row.module.css";

const THEMES: Theme[] = ["light", "dark"];

/** A post as a list item: both images, title, status, date and meta, then actions; it stacks on phones. With `linked`, the whole row opens the post. */
export function StackRow({
  stack,
  status,
  meta,
  linked = false,
  children,
  actions,
}: {
  stack: PublicStack;
  status: ComponentProps<typeof StatusBadge>["status"];
  meta: string | null;
  linked?: boolean;
  children?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li className={styles.row}>
      <div className={styles.images}>
        {THEMES.map((theme) => (
          <img
            key={theme}
            src={stack.images[theme]}
            alt=""
            width={stack.width}
            height={stack.height}
            loading="lazy"
            decoding="async"
            className={styles.image}
          />
        ))}
      </div>
      <div className={styles.info}>
        <h2 className={styles.title}>
          {linked ? (
            <Link to="/s/$id" params={{ id: stack.id }} className={styles.link}>
              {stack.title}
            </Link>
          ) : (
            stack.title
          )}
        </h2>
        <div className={styles.meta}>
          <StatusBadge status={status} />
          <time dateTime={stack.createdAt}>{formatDate(stack.createdAt)}</time>
          {meta ? <span>{meta}</span> : null}
        </div>
        {children}
      </div>
      <div className={styles.actions}>{actions}</div>
    </li>
  );
}
