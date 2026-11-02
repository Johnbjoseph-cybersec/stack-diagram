import { InstallBlock } from "@/components/install-block.tsx";
import { PageShell } from "@/components/page-shell.tsx";
import { SectionBand } from "@/components/section-band.tsx";

import styles from "./share-guide-page.module.css";

const STEPS = [
  { title: "Draw a diagram", body: "Ask your agent to diagram your stack." },
  {
    title: "Share it",
    body: "When the agent offers, say yes. It shows everything that will be public and asks again before posting.",
  },
  {
    title: "Delete it anytime",
    body: "Use the delete key the agent saved, or sign in with GitHub on My posts.",
  },
];

const SHOWN = ["Title, in English", "Tech stack", "Display name", "Light and dark PNG"];

const NEVER_SHOWN = [
  "Your prompt",
  "Your GitHub login (only used to delete)",
  "Your IP address (hashed, for spam limits)",
];

function Disclosure({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "shown" | "never";
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            <span className={styles.mark} data-tone={tone} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ShareGuidePage() {
  return (
    <PageShell>
      <SectionBand
        title="Share a diagram"
        description="Post a diagram you drew with the skill to the gallery."
      />
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.number} aria-hidden>
            1
          </span>
          <h2 className={styles.stepTitle}>Install the skill</h2>
          <div className={styles.install}>
            <InstallBlock compact tone="paper" />
          </div>
        </li>
        {STEPS.map(({ title, body }, index) => (
          <li key={title} className={styles.step}>
            <span className={styles.number} aria-hidden>
              {index + 2}
            </span>
            <h2 className={styles.stepTitle}>{title}</h2>
            <p className={styles.stepBody}>{body}</p>
          </li>
        ))}
      </ol>
      <div className={styles.disclosures}>
        <Disclosure title="Shown in the gallery" items={SHOWN} tone="shown" />
        <Disclosure title="Never shown" items={NEVER_SHOWN} tone="never" />
      </div>
    </PageShell>
  );
}
