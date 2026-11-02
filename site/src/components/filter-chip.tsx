import { useRender } from "@base-ui/react/use-render";
import type { ReactNode } from "react";

import { cx } from "@/lib/cx.ts";

import { TechLogo } from "./tech-logo.tsx";

import styles from "./filter-chip.module.css";

type FilterChipProps = Omit<useRender.ComponentProps<"button">, "children"> & {
  label: string;
  count?: number;
  /** A tech's logo; null draws the fallback tile, leaving it out draws nothing. */
  logo?: string | null;
  wide?: boolean;
  icon?: ReactNode;
  selected?: boolean;
};

/** A sort or filter pill; a `<button>` by default, or pass `render={<Link … />}` to make it a link. */
export function FilterChip({
  label,
  count,
  logo,
  wide = false,
  icon,
  selected = false,
  render,
  className,
  ...props
}: FilterChipProps) {
  const isButton = render === undefined;
  const logoOnly = wide && Boolean(logo);

  return useRender({
    defaultTagName: "button",
    render,
    props: {
      type: isButton ? "button" : undefined,
      "aria-pressed": isButton ? selected : undefined,
      "aria-current": !isButton && selected ? "true" : undefined,
      ...props,
      className: cx(styles.chip, className),
      "data-selected": selected || undefined,
      children: (
        <>
          {icon ? (
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
          ) : null}
          {logo === undefined ? null : <TechLogo src={logo} alt={logoOnly ? label : ""} />}
          {logoOnly ? null : <span>{label}</span>}
          {count === undefined ? null : <span className={styles.count}>{count}</span>}
        </>
      ),
    },
  });
}
