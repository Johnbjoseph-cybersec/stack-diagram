import { Link } from "@tanstack/react-router";

import { Logo } from "./logo.tsx";

import styles from "./site-header.module.css";

export function SiteHeader({ active }: { active?: "gallery" | "me" }) {
  return (
    <header className={styles.header}>
      <Link to="/" activeOptions={{ exact: true }} className={styles.home}>
        <Logo />
      </Link>
      <nav className={styles.nav} aria-label="Sections">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={styles.pill}
          data-section="gallery"
          aria-current={active === "gallery" ? "page" : undefined}
        >
          <span className={styles.mark} aria-hidden />
          Gallery
        </Link>
        <Link
          to="/me"
          className={styles.pill}
          data-section="me"
          aria-current={active === "me" ? "page" : undefined}
        >
          <span className={styles.mark} aria-hidden />
          My posts
        </Link>
      </nav>
    </header>
  );
}
