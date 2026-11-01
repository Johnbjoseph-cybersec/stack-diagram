import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";

import { errorText } from "@/lib/error-text.ts";
import type { SubmissionMode } from "@/lib/settings.ts";

import { setMode } from "../server/overview.ts";

import styles from "./mode-switch.module.css";

/** Open, Review or Closed for new submissions; the pressed segment moves before the save lands. */
export function ModeSwitch({ mode }: { mode: SubmissionMode }) {
  const router = useRouter();
  const labelId = useId();
  const [next, setNext] = useState<SubmissionMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const change = async (value: SubmissionMode) => {
    setNext(value);
    setError(null);
    try {
      await setMode({ data: { mode: value } });
      await router.invalidate();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setNext(null);
    }
  };

  return (
    <div className={styles.switch}>
      <span id={labelId} className={styles.label}>
        Submissions
      </span>
      <ToggleGroup
        value={[next ?? mode]}
        onValueChange={([value]) => {
          if (value && next === null) void change(value);
        }}
        aria-labelledby={labelId}
        className={styles.group}
      >
        <Toggle value="open" className={styles.segment}>
          Open
        </Toggle>
        <Toggle value="review" className={styles.segment}>
          Review
        </Toggle>
        <Toggle value="closed" className={styles.segment}>
          Closed
        </Toggle>
      </ToggleGroup>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
