import { z } from "zod";

const githubUser = z.object({ id: z.int().positive() });

/** The numeric id behind a login, so a renamed account still owns its posts; null on any failure. */
export async function lookUpGitHubId(login: string, token: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        // GitHub refuses requests without one, and Workers send none.
        "user-agent": "stack-diagram-gallery",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return null;
    }
    return String(githubUser.parse(await response.json()).id);
  } catch (error) {
    console.error("GitHub lookup failed", error);
    return null;
  }
}
