import type { ComponentProps, ReactNode } from "react";

import { SiteFooter } from "./site-footer.tsx";
import { SiteHeader } from "./site-header.tsx";

import styles from "./page-shell.module.css";

const MAIN_ID = "main";

/** Moves focus to the main content when a reload removed the focused element, such as a deleted row's button. */
export function refocusMain() {
  if (document.activeElement === null || document.activeElement === document.body) {
    document.getElementById(MAIN_ID)?.focus();
  }
}

/** The page frame: header, the page's sections in `<main>`, and the footer, at the page width. */
export function PageShell({
  active,
  children,
}: {
  active?: ComponentProps<typeof SiteHeader>["active"];
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <SiteHeader active={active} />
      <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
