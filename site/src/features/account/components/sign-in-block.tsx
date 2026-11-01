import { useState } from "react";

import { GitHubMark } from "@/components/brand-marks.tsx";
import { Button } from "@/components/button.tsx";
import { signInWithGitHub } from "@/lib/auth-client.ts";
import { errorText } from "@/lib/error-text.ts";

import styles from "./sign-in-block.module.css";

export function SignInBlock() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On success the browser leaves for GitHub, so the button stays disabled.
  const signIn = async () => {
    setPending(true);
    setError(null);
    try {
      await signInWithGitHub("/me");
    } catch (cause) {
      setError(errorText(cause));
      setPending(false);
    }
  };

  return (
    <section className={styles.block}>
      <h2 className={styles.title}>Sign in to manage your posts</h2>
      <p className={styles.body}>
        Use the GitHub account you gave when sharing. Only your public profile is read.
      </p>
      <Button disabled={pending} onClick={() => void signIn()}>
        <GitHubMark />
        Sign in with GitHub
      </Button>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
