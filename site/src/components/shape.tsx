import { cx } from "@/lib/cx.ts";

import styles from "./shape.module.css";

export type ShapeKind = "circle" | "triangle" | "pentagon" | "square";

/** One of the four signature marks, filled with its eye colour unless a class overrides `color`. */
export function Shape({ kind, className }: { kind: ShapeKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      focusable="false"
      className={cx(styles.shape, className)}
      data-kind={kind}
    >
      {kind === "circle" && <circle cx="50" cy="50" r="44" fill="currentColor" />}
      {kind === "triangle" && (
        <path
          d="M60.428 12.6469L94.9756 73.5168C97.0826 77.2294 97.0575 81.7801 94.9102 85.4687C92.7618 89.1572 88.816 91.4255 84.5486 91.4255H15.4514C11.184 91.4255 7.23821 89.1572 5.08982 85.4687C2.94252 81.7801 2.91745 77.2294 5.02442 73.5168L39.572 12.6469C41.7029 8.894 45.6847 6.57448 50 6.57448C54.3153 6.57448 58.2971 8.894 60.428 12.6469Z"
          fill="currentColor"
        />
      )}
      {kind === "pentagon" && (
        <path
          d="M46.586 12.3623C48.6401 10.941 51.3599 10.941 53.4141 12.3623L86.2158 35.0593C88.4219 36.5859 89.3466 39.3915 88.4803 41.9307L76.073 78.298C75.2441 80.7276 72.9615 82.3607 70.3944 82.3607H29.6056C27.0385 82.3607 24.7559 80.7276 23.927 78.298L11.5197 41.9307C10.6534 39.3915 11.5781 36.5859 13.7842 35.0593L46.586 12.3623Z"
          fill="currentColor"
        />
      )}
      {kind === "square" && (
        <rect x="10" y="10" width="80" height="80" rx="16" fill="currentColor" />
      )}
    </svg>
  );
}
