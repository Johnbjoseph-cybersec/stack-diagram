import { useEffect, useEffectEvent, useRef } from "react";

import styles from "./turnstile.module.css";

type TurnstileOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "error-callback"?: (code: string) => boolean;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string | null | undefined;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | undefined;

function loadTurnstile() {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Turnstile didn't load."));
    };
    script.addEventListener("load", () => (window.turnstile ? resolve(window.turnstile) : fail()));
    script.addEventListener("error", fail);
    document.head.appendChild(script);
  });
  return loading;
}

/** A Cloudflare Turnstile widget, rendered explicitly; the script loads once, on first use. */
export function Turnstile({
  siteKey,
  onToken,
  onError,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (error: Error) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const token = useEffectEvent(onToken);
  const error = useEffectEvent(onError);

  useEffect(() => {
    let widgetId: string | null | undefined;
    let active = true;
    const mount = async () => {
      try {
        const turnstile = await loadTurnstile();
        if (active && ref.current) {
          widgetId = turnstile.render(ref.current, {
            sitekey: siteKey,
            theme: "light",
            callback: (value) => token(value),
            "error-callback": () => {
              error(new Error("Verification failed. Try again."));
              return true;
            },
          });
        }
      } catch (cause) {
        if (active) error(cause instanceof Error ? cause : new Error(String(cause)));
      }
    };
    void mount();
    return () => {
      active = false;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  return <div ref={ref} className={styles.widget} />;
}
