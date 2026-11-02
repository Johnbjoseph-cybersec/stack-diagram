import { useState } from "react";

import { cx } from "@/lib/cx.ts";

import styles from "./tech-logo.module.css";

/** An official logo at a fixed height, up to 1.5 × the height wide, or 2.5 × for a wordmark. A tech without a logo, or whose logo fails, gets a hollow tile like the site mark. */
export function TechLogo({
  src,
  alt,
  size = 16,
  wordmark = false,
  className,
}: {
  src: string | null;
  alt: string;
  size?: 16 | 20;
  wordmark?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  if (src === null || state === "failed") {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cx(styles.fallback, className)}
        data-size={size}
      />
    );
  }
  return (
    <img
      // An SSR image can finish before hydration, when onLoad and onError are not attached yet.
      ref={(img) => {
        if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "failed");
      }}
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onLoad={() => setState("loaded")}
      onError={() => setState("failed")}
      className={cx(styles.logo, className)}
      data-size={size}
      data-wordmark={wordmark || undefined}
      data-loading={state === "loading" || undefined}
    />
  );
}
