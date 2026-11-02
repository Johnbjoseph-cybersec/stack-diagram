import { describe, expect, it } from "vite-plus/test";

import { parseMeta } from "./meta.ts";

const VALID = {
  title: "Next.js and Hono on Vercel",
  name: "caru",
  stack: [{ name: "Hono", icon: "https://svgl.app/library/hono.svg" }],
};

const parse = (meta: unknown) => parseMeta(JSON.stringify(meta));

describe("parseMeta", () => {
  it("accepts a post and trims its text", () => {
    expect(parse({ ...VALID, title: "  Stack  ", github: "octo-cat" })).toEqual({
      ok: true,
      meta: { ...VALID, title: "Stack", github: "octo-cat" },
    });
  });

  it("counts code points, not UTF-16 units", () => {
    expect(parse({ ...VALID, title: "😀".repeat(80) })).toMatchObject({ ok: true });
    expect(parse({ ...VALID, title: "😀".repeat(81) })).toEqual({
      ok: false,
      error: "meta.title must be 1-80 characters",
    });
    expect(parse({ ...VALID, name: "𝓬".repeat(40) })).toMatchObject({ ok: true });
    expect(parse({ ...VALID, stack: [{ name: "語".repeat(41) }] })).toEqual({
      ok: false,
      error: "meta.stack.0.name must be 1-40 characters",
    });
  });

  it("refuses blank text", () => {
    expect(parse({ ...VALID, name: "   " })).toEqual({
      ok: false,
      error: "meta.name must be 1-40 characters",
    });
  });

  it("takes 1-24 technologies", () => {
    const item = { name: "Hono" };
    expect(parse({ ...VALID, stack: Array.from({ length: 24 }, () => item) })).toMatchObject({
      ok: true,
    });
    for (const length of [0, 25]) {
      expect(parse({ ...VALID, stack: Array.from({ length }, () => item) })).toEqual({
        ok: false,
        error: "meta.stack must list 1-24 technologies",
      });
    }
  });

  it("takes only a GitHub login", () => {
    for (const github of ["-octo", "octo_cat", "a".repeat(40), ""]) {
      expect(parse({ ...VALID, github })).toEqual({
        ok: false,
        error: "meta.github is not a valid GitHub login",
      });
    }
  });

  it("refuses an icon that is not a URL", () => {
    expect(parse({ ...VALID, stack: [{ name: "Hono", iconDark: "hono.svg" }] })).toEqual({
      ok: false,
      error: "meta.stack.0.iconDark must be a URL",
    });
  });

  it("refuses anything but a JSON object", () => {
    for (const raw of ["not json", "[]", "null", null]) {
      expect(parseMeta(raw)).toEqual({ ok: false, error: "meta must be a JSON object" });
    }
  });
});
