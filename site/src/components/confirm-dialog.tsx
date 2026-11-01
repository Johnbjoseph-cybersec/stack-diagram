import { AlertDialog } from "@base-ui/react/alert-dialog";
import { type ReactElement, useRef, useState } from "react";

import { errorText } from "@/lib/error-text.ts";

import { Button } from "./button.tsx";

import styles from "./confirm-dialog.module.css";

/** Asks before a destructive action; it stays open on failure and calls `onDone` once closed after success. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  onDone,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = useRef(false);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      confirmed.current = true;
      setOpen(false);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        setError(null);
      }}
      onOpenChangeComplete={(next) => {
        if (next || !confirmed.current) return;
        confirmed.current = false;
        onDone?.();
      }}
    >
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.backdrop} />
        <AlertDialog.Popup className={styles.popup}>
          <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={styles.description}>
            {description}
          </AlertDialog.Description>
          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            <AlertDialog.Close render={<Button variant="outline" size="lg" />} disabled={pending}>
              Cancel
            </AlertDialog.Close>
            <Button
              variant="danger-tint"
              size="lg"
              disabled={pending}
              onClick={() => void confirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
