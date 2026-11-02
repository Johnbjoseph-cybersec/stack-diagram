import { describe, expect, it, vi } from "vite-plus/test";

import {
  cacheKey,
  isCacheableRequest,
  isStorableResponse,
  withPageCacheControl,
} from "./server.ts";

vi.mock("@tanstack/react-start/server-entry", () => ({ default: { fetch: vi.fn() } }));

const SESSION = "__Secure-neon-auth.session_token=abc";
const VOTER = "sd_voter=id.1.sig";

const get = (path: string, cookie?: string) =>
  new Request(`https://stacks.caru.moe${path}`, { headers: cookie ? { cookie } : {} });

describe("isCacheableRequest", () => {
  it.each([
    "/",
    "/s/abc",
    "/share",
    "/api/stacks?sort=new",
    "/og/home",
    "/og/s/abc",
    "/files/icons/a.svg",
    "/files/stacks/abc/light.webp",
  ])("caches an anonymous GET of %s", (path) => {
    expect(isCacheableRequest(get(path))).toBe(true);
  });

  it.each([
    "/me",
    "/admin",
    "/api/auth/get-session",
    "/api/stacks/abc",
    "/files/other/abc",
    "/s/abc/x",
    "/_serverFn/x",
  ])("bypasses %s", (path) => {
    expect(isCacheableRequest(get(path))).toBe(false);
  });

  it("bypasses anything but GET", () => {
    expect(
      isCacheableRequest(new Request("https://stacks.caru.moe/api/stacks", { method: "POST" })),
    ).toBe(false);
    expect(isCacheableRequest(new Request("https://stacks.caru.moe/", { method: "HEAD" }))).toBe(
      false,
    );
  });

  it.each(["/", "/s/abc", "/share", "/api/stacks"])("bypasses %s with a session cookie", (path) => {
    expect(isCacheableRequest(get(path, `theme=dark; ${SESSION}`))).toBe(false);
  });

  it("bypasses a stack page, and only a stack page, with a voter cookie", () => {
    expect(isCacheableRequest(get("/s/abc", VOTER))).toBe(false);
    expect(isCacheableRequest(get("/", VOTER))).toBe(true);
    expect(isCacheableRequest(get("/api/stacks", VOTER))).toBe(true);
  });

  it("serves OG images and files from the cache even to signed-in voters", () => {
    expect(isCacheableRequest(get("/og/s/abc", `${SESSION}; ${VOTER}`))).toBe(true);
    expect(isCacheableRequest(get("/files/icons/a.svg", SESSION))).toBe(true);
    expect(isCacheableRequest(get("/files/stacks/abc/dark.webp", SESSION))).toBe(true);
  });

  it("ignores cookies that only resemble the session cookie by value", () => {
    expect(isCacheableRequest(get("/", "note=__Secure-neon-auth"))).toBe(true);
  });
});

const response = (cacheControl: string | null, status = 200, setCookie?: string) => {
  const headers = new Headers();
  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }
  if (setCookie) {
    headers.set("set-cookie", setCookie);
  }
  return new Response("ok", { status, headers });
};

const html = (status = 200, cacheControl?: string) =>
  new Response("<html></html>", {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...(cacheControl ? { "cache-control": cacheControl } : {}),
    },
  });

const pageCacheControl = (path: string, page: Response, cacheable: boolean) =>
  withPageCacheControl(get(path), page, cacheable).headers.get("cache-control");

describe("cacheKey", () => {
  it("drops the query string of files and OG images", () => {
    expect(cacheKey(get("/files/icons/a.svg?1"))).toBe("https://stacks.caru.moe/files/icons/a.svg");
    expect(cacheKey(get("/og/s/abc?x=2"))).toBe("https://stacks.caru.moe/og/s/abc");
  });

  it("keeps the query string of pages and the list API", () => {
    expect(cacheKey(get("/?sort=new"))).toBe("https://stacks.caru.moe/?sort=new");
    expect(cacheKey(get("/api/stacks?tech=hono"))).toBe(
      "https://stacks.caru.moe/api/stacks?tech=hono",
    );
  });
});

describe("isStorableResponse", () => {
  it.each(["public, s-maxage=60", "public, max-age=3600", "Public, S-MaxAge=60"])(
    "stores a 200 with %j",
    (cacheControl) => {
      expect(isStorableResponse(response(cacheControl))).toBe(true);
    },
  );

  it.each([
    ["no Cache-Control", null],
    ["public without a lifetime", "public"],
    ["a zero lifetime", "public, max-age=0"],
    ["a lifetime without public", "s-maxage=60"],
    ["private", "public, private, max-age=60"],
    ["no-store", "public, no-store, max-age=60"],
  ])("skips %s", (_, cacheControl) => {
    expect(isStorableResponse(response(cacheControl))).toBe(false);
  });

  it("skips anything but 200", () => {
    expect(isStorableResponse(response("public, s-maxage=60", 404))).toBe(false);
    expect(isStorableResponse(response("public, s-maxage=60", 400))).toBe(false);
  });

  it("skips a response that sets a cookie", () => {
    expect(isStorableResponse(response("public, s-maxage=60", 200, "a=b"))).toBe(false);
  });
});

describe("withPageCacheControl", () => {
  it("shares a public page for a minute", () => {
    expect(pageCacheControl("/s/abc", html(), true)).toBe("public, s-maxage=60");
  });

  it("keeps a page private when the request was personal", () => {
    expect(pageCacheControl("/", html(), false)).toBe("private, no-store");
  });

  it("keeps other pages private", () => {
    expect(pageCacheControl("/me", html(), true)).toBe("private, no-store");
  });

  it("keeps a failed page private", () => {
    expect(pageCacheControl("/s/missing", html(404), true)).toBe("private, no-store");
  });

  it("leaves a route's own Cache-Control alone", () => {
    expect(pageCacheControl("/", html(200, "no-cache"), true)).toBe("no-cache");
  });

  it("leaves non-HTML responses alone", () => {
    expect(pageCacheControl("/", new Response("{}"), true)).toBeNull();
  });
});
