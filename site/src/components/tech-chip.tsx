import type { PublicStackItem } from "@/lib/public-stack.ts";

import { TechLogo } from "./tech-logo.tsx";

import styles from "./tech-chip.module.css";

/** A technology as its official logo and name; a wordmark logo stands in for the name. */
export function TechChip({ item, size = "sm" }: { item: PublicStackItem; size?: "sm" | "lg" }) {
  const logoOnly = item.wide && item.icon !== null;

  return (
    <span className={styles.chip} data-size={size}>
      <TechLogo src={item.icon} alt={logoOnly ? item.name : ""} size={size === "lg" ? 20 : 16} />
      {logoOnly ? null : <span>{item.name}</span>}
    </span>
  );
}
