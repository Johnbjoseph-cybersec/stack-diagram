import { Button } from "@base-ui/react/button";
import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Turnstile } from "@/components/turnstile.tsx";

import { ChallengeClosed, NOT_SET_UP } from "../utils/challenge.ts";

import styles from "./challenge-panel.module.css";

type Pending = { resolve: (token: string) => void; reject: (cause: Error) => void };

// Keyboard users land in the panel and go back to where they were once it closes.
const holdFocus = (panel: HTMLDivElement | null) => {
  if (!panel) return undefined;
  const previous = document.activeElement;
  panel.focus();
  return () => {
    if (panel.contains(document.activeElement) && previous instanceof HTMLElement) {
      previous.focus();
    }
  };
};

/** `solve` opens the Turnstile panel and settles with its token, or with ChallengeClosed when dismissed. */
export function useChallenge(siteKey: string) {
  const [pending, setPending] = useState<Pending | null>(null);

  const solve = () =>
    siteKey
      ? new Promise<string>((resolve, reject) => setPending({ resolve, reject }))
      : Promise.reject(new Error(NOT_SET_UP));

  const settle = (finish: (current: Pending) => void) => {
    if (pending) finish(pending);
    setPending(null);
  };

  const panel = pending ? (
    <div
      ref={holdFocus}
      tabIndex={-1}
      role="group"
      aria-label="Verification"
      className={styles.panel}
    >
      <Turnstile
        siteKey={siteKey}
        onToken={(token) => settle((current) => current.resolve(token))}
        onError={(cause) => settle((current) => current.reject(cause))}
      />
      <Button
        type="button"
        aria-label="Close"
        className={styles.close}
        onClick={() => settle((current) => current.reject(new ChallengeClosed()))}
      >
        <XIcon weight="bold" aria-hidden />
      </Button>
    </div>
  ) : null;

  return { solve, panel };
}
