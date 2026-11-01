export const NOT_SET_UP = "This isn't set up here.";
const MAX_TOKENS = 2;

type NeedsChallenge = { needsChallenge: true };

export class ChallengeClosed extends Error {}

const needsChallenge = (result: object): result is NeedsChallenge => "needsChallenge" in result;

/** Sends the action with a Turnstile token whenever the server asks; without a voter pass it asks first. */
export async function withChallenge<T extends object>(
  send: (turnstileToken?: string) => Promise<T | NeedsChallenge>,
  solve: () => Promise<string>,
  { hasPass }: { hasPass: boolean },
): Promise<T> {
  let tokens = 0;
  let token: string | undefined;
  if (!hasPass) {
    token = await solve();
    tokens += 1;
  }
  for (;;) {
    const result = await send(token);
    if (!needsChallenge(result)) {
      return result;
    }
    // Fresh tokens that keep failing mean the server can't verify them at all.
    if (tokens >= MAX_TOKENS) {
      throw new Error(NOT_SET_UP);
    }
    token = await solve();
    tokens += 1;
  }
}
