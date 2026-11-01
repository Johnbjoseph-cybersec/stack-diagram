import { cx } from "@/lib/cx.ts";

import styles from "./logo.module.css";

/** The hollow iris tile and the "stack-diagram" wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx(styles.logo, className)}>
      <span className={styles.mark} aria-hidden />
      <span className={styles.wordmark}>stack-diagram</span>
    </span>
  );
}
