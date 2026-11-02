import { describe, expect, test, vi } from "vite-plus/test";

vi.mock("cloudflare:workers", () => ({ env: {} }));

const { parseAdminIds, returnPath } = await import("./auth.ts");

describe("parseAdminIds", () => {
  test("ignores blanks, spaces and non-numeric entries", () => {
    expect(parseAdminIds(" 123, ,456 ,,caru-ini,")).toEqual(new Set(["123", "456"]));
  });

  test("is empty when unset", () => {
    expect(parseAdminIds("").size).toBe(0);
  });
});

describe("returnPath", () => {
  const origin = "https://stacks.caru.moe";

  test("keeps a path on this origin", () => {
    expect(returnPath("/me?tab=held#top", origin)).toBe("/me?tab=held#top");
    expect(returnPath(`${origin}/admin`, origin)).toBe("/admin");
  });

  test("sends anything else home", () => {
    expect(returnPath(null, origin)).toBe("/");
    expect(returnPath("//evil.example/me", origin)).toBe("/");
    expect(returnPath("/\\evil.example", origin)).toBe("/");
    expect(returnPath("https://evil.example/me", origin)).toBe("/");
    expect(returnPath("javascript:alert(1)", origin)).toBe("/");
    expect(returnPath("/.//evil.example", origin)).toBe("/");
    expect(returnPath(`${origin}//evil.example`, origin)).toBe("/");
    expect(returnPath("/%2e//evil.example", origin)).toBe("/");
  });
});
