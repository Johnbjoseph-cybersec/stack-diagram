import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";

import { cx } from "@/lib/cx.ts";

import styles from "./menu.module.css";

export function MenuPopup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.Positioner side="bottom" align="end" sideOffset={8} className={styles.positioner}>
        <Menu.Popup className={cx(styles.popup, className)}>{children}</Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

/** A menu row with a leading icon; `danger` turns the highlight and the icon red. */
export function MenuItem({
  tone,
  ...props
}: Omit<Menu.Item.Props, "className"> & { tone?: "danger" }) {
  return <Menu.Item {...props} className={styles.item} data-tone={tone} />;
}
