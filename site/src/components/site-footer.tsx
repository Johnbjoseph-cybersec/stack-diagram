import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { GitHubMark, VercelMark } from "./brand-marks.tsx";
import { Shape } from "./shape.tsx";

import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.signature} aria-hidden>
        <Shape kind="circle" />
        <Shape kind="triangle" />
        <Shape kind="pentagon" />
        <Shape kind="square" />
      </div>
      <div className={styles.row}>
        <p className={styles.credit}>© 2026 caru-ini · Logos are trademarks of their owners.</p>
        <ul className={styles.links}>
          <li>
            <a
              href="https://github.com/caru-ini/stack-diagram"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <GitHubMark className={styles.icon} />
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://skills.sh/caru-ini/stack-diagram"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <VercelMark className={styles.vercel} />
              skills.sh
            </a>
          </li>
          <li>
            <Link to="/share" className={styles.link}>
              <ArrowSquareOutIcon weight="bold" className={styles.icon} aria-hidden />
              How to share
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
