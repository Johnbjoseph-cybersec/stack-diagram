import { Button } from "@base-ui/react/button";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { VisuallyHidden } from "./visually-hidden.tsx";

import styles from "./copy-button.module.css";

/** Icon-only copy button; it shows a check for a moment after copying. */
export function CopyButton({
  text,
  label,
  size = "md",
}: {
  text: string;
  label: string;
  size?: "md" | "sm";
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = copied ? setTimeout(() => setCopied(false), 1600) : undefined;
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <Button
        type="button"
        aria-label={label}
        className={styles.button}
        data-size={size}
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => setCopied(true));
        }}
      >
        {copied ? <CheckIcon weight="bold" aria-hidden /> : <CopyIcon weight="bold" aria-hidden />}
      </Button>
      <VisuallyHidden>
        <span role="status">{copied ? "Copied" : ""}</span>
      </VisuallyHidden>
    </>
  );
}
