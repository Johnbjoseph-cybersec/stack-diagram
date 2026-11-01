import { CheckIcon, EyeSlashIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/button.tsx";
import { ConfirmDialog } from "@/components/confirm-dialog.tsx";
import { refocusMain } from "@/components/page-shell.tsx";
import { StackRow } from "@/components/stack-row.tsx";
import { errorText } from "@/lib/error-text.ts";

import { type Action, canModerate } from "../moderation.ts";
import { moderate } from "../server/moderate.ts";
import type { AdminItem } from "../server/queue.ts";
import { moderationMeta, reasonChips } from "../utils/labels.ts";

import styles from "./moderation-row.module.css";

const PRIMARY = ["keep", "publish"] as const;

export function ModerationRow({ item }: { item: AdminItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action) => {
    setPending(true);
    setError(null);
    try {
      await moderate({ data: { id: item.id, action } });
      await router.invalidate();
      refocusMain();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setPending(false);
    }
  };

  const primary = PRIMARY.find((action) => canModerate(item, action));
  const chips = reasonChips(item);

  return (
    <StackRow
      stack={item}
      status={item.status}
      meta={moderationMeta(item)}
      actions={
        <>
          {primary ? (
            <Button disabled={pending} onClick={() => void run(primary)}>
              <CheckIcon weight="bold" aria-hidden />
              {primary === "keep" ? "Keep" : "Publish"}
            </Button>
          ) : null}
          {canModerate(item, "hide") ? (
            <Button variant="outline" disabled={pending} onClick={() => void run("hide")}>
              <EyeSlashIcon weight="bold" aria-hidden />
              {item.status === "hidden" ? "Keep hidden" : "Hide"}
            </Button>
          ) : null}
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={pending}>
                <TrashIcon weight="bold" aria-hidden />
                Delete
              </Button>
            }
            title="Delete this post?"
            description="This can't be undone."
            confirmLabel="Delete"
            onConfirm={() => moderate({ data: { id: item.id, action: "delete" } })}
            onDone={() => void router.invalidate().then(refocusMain)}
          />
        </>
      }
    >
      {chips.length > 0 ? (
        <ul className={styles.reasons}>
          {chips.map((chip) => (
            <li key={chip.label} className={styles.reason} data-flagged={chip.flagged || undefined}>
              {chip.label}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </StackRow>
  );
}
