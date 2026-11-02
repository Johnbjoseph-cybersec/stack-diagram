import { Tabs } from "@base-ui/react/tabs";
import { SparkleIcon, TerminalIcon } from "@phosphor-icons/react";

import { CopyButton } from "./copy-button.tsx";
import { InstallCommand } from "./install-command.tsx";

import styles from "./install-block.module.css";

const INSTALL_PROMPT =
  'Use the skills in "https://github.com/caru-ini/stack-diagram" that are relevant to the current task. Run `npx skills add "https://github.com/caru-ini/stack-diagram"` and select the relevant skills, then follow their instructions.';

/** Install as a command or as a prompt to paste into an agent. */
export function InstallBlock({
  compact = false,
  tone = "surface",
}: {
  compact?: boolean;
  tone?: "surface" | "paper";
}) {
  return (
    <Tabs.Root defaultValue="command" className={styles.block}>
      <Tabs.List className={styles.list} aria-label="Install with">
        <Tabs.Tab value="command" className={styles.tab}>
          <TerminalIcon weight="bold" aria-hidden />
          Command
        </Tabs.Tab>
        <Tabs.Tab value="prompt" className={styles.tab}>
          <SparkleIcon weight="bold" aria-hidden />
          Prompt
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="command" className={styles.panel}>
        <InstallCommand size={compact ? "md" : "lg"} tone={tone} />
      </Tabs.Panel>
      <Tabs.Panel value="prompt" className={styles.panel}>
        <div className={styles.prompt} data-tone={tone}>
          <p className={styles.promptText}>{INSTALL_PROMPT}</p>
          <CopyButton text={INSTALL_PROMPT} label="Copy prompt" />
        </div>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
