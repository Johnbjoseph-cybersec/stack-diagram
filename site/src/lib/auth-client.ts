import { useEffect, useState } from "react";

export type SessionUser = { name: string; image: string | null };

// @neon/auth draws a random id as its module loads, which workerd rejects, so only the browser loads it.
async function createClient() {
  const { createAuthClient } = await import("@neon/auth");
  return createAuthClient(`${location.origin}/api/auth`);
}

let client: ReturnType<typeof createClient> | undefined;

const loadClient = () => (client ??= createClient());

export async function signInWithGitHub(callbackURL: string) {
  const back = new URL("/api/auth/oauth-return", location.origin);
  back.searchParams.set("to", callbackURL);
  const auth = await loadClient();
  const { error } = await auth.signIn.social({
    provider: "github",
    callbackURL: back.href,
    errorCallbackURL: back.href,
  });
  if (error) {
    throw new Error(error.message ?? "GitHub sign-in failed.");
  }
}

export async function signOut() {
  const auth = await loadClient();
  await auth.signOut();
}

export function useSession() {
  const [state, setState] = useState<{ user: SessionUser | null; isPending: boolean }>({
    user: null,
    isPending: true,
  });
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const subscribe = async () => {
      const auth = await loadClient();
      if (active) {
        unsubscribe = auth.useSession.subscribe(({ data, isPending }) =>
          setState({
            user: data ? { name: data.user.name, image: data.user.image ?? null } : null,
            isPending,
          }),
        );
      }
    };
    subscribe().catch(() => setState({ user: null, isPending: false }));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return state;
}
