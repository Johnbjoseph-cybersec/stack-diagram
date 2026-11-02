import { BackLink } from "./back-link.tsx";
import { PageShell } from "./page-shell.tsx";

import styles from "./page-message.module.css";

/** A page that only says why there is nothing to show, with the way back to the gallery. */
export function PageMessage({ message }: { message: string }) {
  return (
    <PageShell>
      <div className={styles.toolbar}>
        <BackLink to="/" label="Gallery" />
      </div>
      <h1 className={styles.message}>{message}</h1>
    </PageShell>
  );
}
