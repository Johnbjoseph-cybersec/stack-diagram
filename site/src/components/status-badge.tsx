import { Shape, type ShapeKind } from "./shape.tsx";

import styles from "./status-badge.module.css";

type Status = "published" | "held" | "hidden";

const BADGES: Record<Status, { label: string; shape: ShapeKind }> = {
  published: { label: "Published", shape: "circle" },
  held: { label: "In review", shape: "triangle" },
  hidden: { label: "Hidden", shape: "square" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, shape } = BADGES[status];

  return (
    <span className={styles.badge} data-status={status}>
      <Shape kind={shape} className={styles.shape} />
      {label}
    </span>
  );
}
