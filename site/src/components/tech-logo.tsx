import { cx } from "@/lib/cx.ts";

import styles from "./tech-logo.module.css";

/** An official logo at a fixed height; wordmarks keep their width up to 2.5 × the height. */
export function TechLogo({
  src,
  alt,
  size = 16,
  className,
}: {
  src: string;
  alt: string;
  size?: 16 | 20;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cx(styles.logo, className)}
      data-size={size}
    />
  );
}
