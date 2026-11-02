import { ArrowSquareOutIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { GitHubMark } from "@/components/brand-marks.tsx";
import { buttonClass } from "@/components/button.tsx";
import { InstallBlock } from "@/components/install-block.tsx";
import { cx } from "@/lib/cx.ts";

import styles from "./hero.module.css";

const REPO_URL = "https://github.com/caru-ini/stack-diagram";
const ZIP_URL = `${REPO_URL}/releases/latest/download/stack-diagram.zip`;

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <div className={styles.copy}>
          <h1 className={styles.title}>stack-diagram</h1>
          <p className={styles.role}>
            An agent skill that draws architecture diagrams with official logos.
          </p>
          <p className={styles.agents}>Works with Claude Code, Codex, Cursor and other agents.</p>
        </div>
        <div className={styles.getIt}>
          <div id="install" className={styles.install}>
            <InstallBlock />
          </div>
          <div className={styles.actions}>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(buttonClass(), styles.github)}
            >
              <GitHubMark />
              GitHub
            </a>
            <div className={styles.more}>
              <a href={ZIP_URL} className={buttonClass({ variant: "tonal" })}>
                <DownloadSimpleIcon weight="bold" aria-hidden />
                Download ZIP
              </a>
              <Link to="/share" className={buttonClass({ variant: "tonal" })}>
                <ArrowSquareOutIcon weight="bold" aria-hidden />
                Share a diagram
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.showcase}>
        <img
          src="/hero.png"
          alt=""
          width={2000}
          height={1140}
          fetchPriority="high"
          decoding="async"
          className={styles.image}
        />
      </div>
    </section>
  );
}
