import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

import { BackLink } from "@/components/back-link.tsx";
import { DiagramZoom } from "@/components/diagram-zoom.tsx";
import { InstallCommand } from "@/components/install-command.tsx";
import { PageShell } from "@/components/page-shell.tsx";
import { StackGrid } from "@/components/stack-grid.tsx";
import { TechChip } from "@/components/tech-chip.tsx";
import { ThemeToggle } from "@/components/theme-toggle.tsx";
import { formatDate } from "@/lib/format.ts";
import type { Theme } from "@/lib/public-stack.ts";

import { PostActions } from "./components/post-actions.tsx";

import styles from "./stack-page.module.css";

const route = getRouteApi("/s/$id");

export function StackPage() {
  const { stack, related, myVote, hasVoterPass, turnstileSiteKey } = route.useLoaderData();
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <PageShell>
      <div className={styles.toolbar}>
        <BackLink to="/" label="Gallery" />
        <ThemeToggle value={theme} onChange={setTheme} />
      </div>
      <div className={styles.panel}>
        <div className={styles.shot}>
          <DiagramZoom
            src={stack.images[theme]}
            alt={stack.title}
            width={stack.width}
            height={stack.height}
          />
        </div>
      </div>
      <div className={styles.head}>
        <div className={styles.about}>
          <h1 className={styles.title}>{stack.title}</h1>
          <p className={styles.byline}>
            <span className={styles.name}>{stack.name}</span>
            <time dateTime={stack.createdAt} className={styles.date}>
              {formatDate(stack.createdAt)}
            </time>
          </p>
          <div className={styles.stack}>
            <h2 className={styles.label}>Stack</h2>
            <ul className={styles.chips}>
              {stack.stack.map((item, index) => (
                <li key={`${index}-${item.name}`}>
                  <TechChip item={item} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.side}>
          <PostActions
            key={`${stack.id}:${stack.score}:${myVote}:${hasVoterPass}`}
            stack={stack}
            theme={theme}
            myVote={myVote}
            hasVoterPass={hasVoterPass}
            turnstileSiteKey={turnstileSiteKey}
          />
          <div className={styles.own}>
            <p className={styles.ownLabel}>Get your own</p>
            <InstallCommand size="sm" />
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section aria-labelledby="more" className={styles.more}>
          <h2 id="more" className={styles.moreTitle}>
            More diagrams
          </h2>
          <StackGrid stacks={related} />
        </section>
      ) : null}
    </PageShell>
  );
}
