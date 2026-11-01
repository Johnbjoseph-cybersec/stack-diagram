import type { ReactNode } from "react";

import styles from "./section-band.module.css";

/** The tinted header band at the top of a section page. */
export function SectionBand({
  title,
  description,
  tone = "mint",
  children,
}: {
  title: string;
  description?: string;
  tone?: "mint" | "iris";
  children?: ReactNode;
}) {
  return (
    <section className={styles.band} data-tone={tone}>
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </section>
  );
}
