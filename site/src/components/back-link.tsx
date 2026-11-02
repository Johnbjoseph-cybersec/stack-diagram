import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link, type LinkProps } from "@tanstack/react-router";

import styles from "./back-link.module.css";

export function BackLink({ to, label }: { to: LinkProps["to"]; label: string }) {
  return (
    <Link to={to} className={styles.link}>
      <ArrowLeftIcon weight="bold" className={styles.icon} aria-hidden />
      {label}
    </Link>
  );
}
