import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

import type { Theme } from "@/lib/public-stack.ts";

import styles from "./theme-toggle.module.css";

/** Light/Dark segmented control; one segment is always pressed. */
export function ThemeToggle({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (next: Theme) => void;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={([next]) => {
        if (next) onChange(next);
      }}
      aria-label="Diagram theme"
      className={styles.group}
    >
      <Toggle value="light" className={styles.segment}>
        <SunIcon weight="bold" aria-hidden />
        Light
      </Toggle>
      <Toggle value="dark" className={styles.segment}>
        <MoonIcon weight="bold" aria-hidden />
        Dark
      </Toggle>
    </ToggleGroup>
  );
}
