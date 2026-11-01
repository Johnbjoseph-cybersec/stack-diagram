import type { ReactNode } from "react";

import styles from "./visually-hidden.module.css";

/** Text for screen readers only, beside a visual that carries the same meaning. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}
