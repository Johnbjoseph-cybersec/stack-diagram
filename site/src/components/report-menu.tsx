import { Menu } from "@base-ui/react/menu";
import { FlagIcon } from "@phosphor-icons/react";

import { buttonClass } from "./button.tsx";
import { MenuItem, MenuPopup } from "./menu.tsx";

import styles from "./report-menu.module.css";

export type ReportReason = "spam" | "abuse" | "exposure" | "other";

const REASONS: { reason: ReportReason; label: string }[] = [
  { reason: "spam", label: "Spam or advertising" },
  { reason: "abuse", label: "Abusive or inappropriate" },
  { reason: "exposure", label: "Exposes someone else's system" },
  { reason: "other", label: "Something else" },
];

export function ReportMenu({ onReport }: { onReport: (reason: ReportReason) => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Report"
        className={buttonClass({ variant: "danger-tint", size: "icon" })}
      >
        <FlagIcon weight="bold" aria-hidden />
      </Menu.Trigger>
      <MenuPopup className={styles.popup}>
        <Menu.Group>
          <Menu.GroupLabel className={styles.title}>Report this post</Menu.GroupLabel>
          {REASONS.map(({ reason, label }) => (
            <MenuItem key={reason} tone="danger" onClick={() => onReport(reason)}>
              <FlagIcon weight="bold" aria-hidden />
              {label}
            </MenuItem>
          ))}
        </Menu.Group>
      </MenuPopup>
    </Menu.Root>
  );
}
