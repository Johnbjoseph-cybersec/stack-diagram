import mediumZoom from "medium-zoom/dist/pure";
import { useEffect, useRef } from "react";

import { cx } from "@/lib/cx.ts";

import styles from "./diagram-zoom.module.css";

/** The diagram on the stack page; a tap opens it full screen as on the portfolio blog. */
export function DiagramZoom({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const zoom = mediumZoom({ margin: 20, background: "var(--base-surface)" });
    if (ref.current) zoom.attach(ref.current);
    return () => {
      zoom.detach();
    };
  }, []);

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      fetchPriority="high"
      decoding="async"
      className={cx(styles.image, className)}
    />
  );
}
