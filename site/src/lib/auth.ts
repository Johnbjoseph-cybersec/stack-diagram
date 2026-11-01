import {
  createAuthServer,
  extractNeonAuthCookies,
  handleAuthProxyRequest,
  handleAuthRequest,
  handleAuthResponse,
  NEON_AUTH_SESSION_COOKIE_NAME,
  parseCookieValue,
} from "@neon/auth/server";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { pgSchema, text, uuid } from "drizzle-orm/pg-core";

import { getDb } from "./db/client.ts";

export type Viewer = {
  userId: string;
  githubId: string;
  login: string | null;
  name: string;
  image: string | null;
  isAdmin: boolean;
};

const OAUTH_RETURN_PATH = "/api/auth/oauth-return";

const VERIFIER_PARAM = "neon_auth_session_verifier";

// Managed by Neon Auth and kept out of schema.ts so drizzle-kit never migrates it.
const account = pgSchema("neon_auth").table("account", {
  userId: uuid("userId").notNull(),
  providerId: text("providerId").notNull(),
  accountId: text("accountId").notNull(),
});

export const parseAdminIds = (value: string) =>
  new Set(
    value
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  );

export function returnPath(to: string | null, origin: string) {
  const url = to ? URL.parse(to, origin) : null;
  const path = url?.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/";
  // `/.//host` parses to the path `//host`, which leaves the origin when resolved again.
  return URL.parse(path, origin)?.origin === origin ? path : "/";
}

export function httpError(status: number, message: string) {
  setResponseStatus(status);
  return Object.assign(new Error(message), { status });
}

export async function handleAuthProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === OAUTH_RETURN_PATH) {
    return completeOAuth(request, url);
  }
  return handleAuthProxyRequest({
    request,
    path: url.pathname.slice("/api/auth/".length),
    baseUrl: env.NEON_AUTH_BASE_URL,
    cookieSecret: env.NEON_AUTH_COOKIE_SECRET,
  });
}

// Trading the verifier here sets the session cookies before the page renders.
async function completeOAuth(request: Request, url: URL) {
  const headers = new Headers({
    location: new URL(returnPath(url.searchParams.get("to"), url.origin), url.origin).href,
  });
  const verifier = url.searchParams.get(VERIFIER_PARAM);
  if (verifier) {
    const exchangeUrl = new URL("/api/auth/get-session", url.origin);
    exchangeUrl.searchParams.set(VERIFIER_PARAM, verifier);
    const exchangeHeaders = new Headers(request.headers);
    exchangeHeaders.set("origin", url.origin);
    const upstream = await handleAuthRequest(
      env.NEON_AUTH_BASE_URL,
      new Request(exchangeUrl, { headers: exchangeHeaders }),
      "get-session",
    );
    const response = await handleAuthResponse(upstream, env.NEON_AUTH_BASE_URL, {
      secret: env.NEON_AUTH_COOKIE_SECRET,
    });
    if (response.ok) {
      for (const cookie of response.headers.getSetCookie()) {
        headers.append("set-cookie", cookie);
      }
    }
  }
  return new Response(null, { status: 302, headers });
}

export async function getViewer(request: Request): Promise<Viewer | null> {
  const cookies = extractNeonAuthCookies(request.headers);
  if (!parseCookieValue(cookies, NEON_AUTH_SESSION_COOKIE_NAME)) {
    return null;
  }
  const auth = createAuthServer({
    baseUrl: env.NEON_AUTH_BASE_URL,
    cookieSecret: env.NEON_AUTH_COOKIE_SECRET,
    // The browser still refreshes its cookies through /api/auth/get-session.
    context: () => ({
      getCookies: () => cookies,
      setCookie: () => {},
      getHeader: (name) => request.headers.get(name),
      getOrigin: () => new URL(request.url).origin,
      getFramework: () => "tanstack-start",
    }),
  });
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) {
    return null;
  }
  const [github] = await getDb()
    .select({ id: account.accountId })
    .from(account)
    .where(and(eq(account.userId, user.id), eq(account.providerId, "github")))
    .limit(1);
  if (!github) {
    return null;
  }
  return {
    userId: user.id,
    githubId: github.id,
    login: null,
    name: user.name,
    image: user.image ?? null,
    isAdmin: parseAdminIds(env.ADMIN_GITHUB_IDS).has(github.id),
  };
}

export async function requireViewer() {
  const viewer = await getViewer(getRequest());
  if (!viewer) {
    throw httpError(401, "Sign in with GitHub first.");
  }
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) {
    throw httpError(403, "Only admins can do this.");
  }
  return viewer;
}
