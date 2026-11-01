import { CopyButton } from "./copy-button.tsx";

import styles from "./install-command.module.css";

const REPO = "caru-ini/stack-diagram";
const INSTALL_COMMAND = `npx skills add ${REPO}`;

/** The one-line install in a pill; `lg` drops to the small mono size on phones, `sm` is the dense pill. */
export function InstallCommand({
  size = "lg",
  tone = "surface",
}: {
  size?: "lg" | "md" | "sm";
  tone?: "surface" | "paper";
}) {
  return (
    <div className={styles.command} data-size={size} data-tone={tone}>
      <code className={styles.text}>
        npx skills add <span className={styles.repo}>{REPO}</span>
      </code>
      <CopyButton text={INSTALL_COMMAND} label="Copy command" size={size === "sm" ? "sm" : "md"} />
    </div>
  );
}
