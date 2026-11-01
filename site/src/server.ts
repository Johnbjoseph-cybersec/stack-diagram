import { NEON_AUTH_COOKIE_PREFIX } from "@neon/auth/server";
import handler from "@tanstack/react-start/server-entry";

import { VOTER_COOKIE } from "@/features/stack/server/voter-pass.ts";

// The DOM lib's CacheStorage shadows the Workers one, which has `default`.
declare global {
  interface CacheStorage {
    readonly default: Cache;
  }
}

const SHARED_FILES = /^\/(?:og|files\/(?:icons|stacks))\//;
const PAGES = /^\/(?:|share|s\/[^/]+)$/;
const LIST_API = /^\/api\/stacks$/;

const cookieNames = (header: string | null) =>
  (header ?? "").split(";").map((pair) => pair.split("=", 1)[0]?.trim() ?? "");

export function isCacheableRequest(request: Request) {
  if (request.method !== "GET") {
    return false;
  }
  const { pathname } = new URL(request.url);
  // Files never depend on cookies, except an owner's private copy, which is never stored.
  if (SHARED_FILES.test(pathname)) {
    return true;
  }
  if (!PAGES.test(pathname) && !LIST_API.test(pathname)) {
    return false;
  }
  // A stack page shows the voter's own vote, so the voter cookie makes it personal too.
  const personal = pathname.startsWith("/s/")
    ? [NEON_AUTH_COOKIE_PREFIX, VOTER_COOKIE]
    : [NEON_AUTH_COOKIE_PREFIX];
  return !cookieNames(request.headers.get("cookie")).some((name) =>
    personal.some((prefix) => name.startsWith(prefix)),
  );
}

/** Files and OG images ignore the query string, so it must not split their cache entries. */
export function cacheKey(request: Request) {
  const url = new URL(request.url);
  return SHARED_FILES.test(url.pathname) ? `${url.origin}${url.pathname}` : url.href;
}

const maxAge = (value: string | undefined) => Number(value ?? 0) > 0;

export function isStorableResponse(response: Response) {
  if (response.status !== 200 || response.headers.has("set-cookie")) {
    return false;
  }
  const directives = new Map(
    (response.headers.get("cache-control") ?? "").split(",").map((part) => {
      const [name = "", value] = part.trim().toLowerCase().split("=", 2);
      return [name, value];
    }),
  );
  return (
    directives.has("public") &&
    !directives.has("private") &&
    !directives.has("no-store") &&
    (maxAge(directives.get("s-maxage")) || maxAge(directives.get("max-age")))
  );
}

/** HTML without its own Cache-Control is shared for 60 s on public pages and private everywhere else. */
export function withPageCacheControl(request: Request, response: Response, cacheable: boolean) {
  if (
    response.headers.has("cache-control") ||
    !response.headers.get("content-type")?.startsWith("text/html")
  ) {
    return response;
  }
  const headers = new Headers(response.headers);
  const shared = cacheable && response.status === 200 && PAGES.test(new URL(request.url).pathname);
  headers.set("cache-control", shared ? "public, s-maxage=60" : "private, no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, _env, ctx) {
    const cacheable = isCacheableRequest(request);
    if (!cacheable) {
      return withPageCacheControl(request, await handler.fetch(request), false);
    }
    const cache = caches.default;
    const key = cacheKey(request);
    const hit = await cache.match(key);
    if (hit) {
      return hit;
    }
    const response = withPageCacheControl(request, await handler.fetch(request), true);
    if (isStorableResponse(response)) {
      ctx.waitUntil(cache.put(key, response.clone()));
    }
    return response;
  },
} satisfies ExportedHandler<Env>;
