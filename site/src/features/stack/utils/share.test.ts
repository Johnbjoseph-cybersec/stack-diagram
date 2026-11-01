import { describe, expect, it } from "vite-plus/test";

import { pngFileName, shareData } from "./share.ts";

describe("pngFileName", () => {
  it("names the file after the title", () => {
    expect(pngFileName("Acme SaaS stack", "light")).toBe("Acme SaaS stack.png");
  });

  it("keeps non-ASCII titles", () => {
    expect(pngFileName("社内ナレッジ検索", "light")).toBe("社内ナレッジ検索.png");
  });

  it("replaces characters that file systems reject", () => {
    expect(pngFileName('a/b\\c:d*e?f"g<h>i|j', "light")).toBe("a b c d e f g h i j.png");
  });

  it("collapses whitespace and drops trailing dots", () => {
    expect(pngFileName("  Next.js \n\t on   Vercel... ", "light")).toBe("Next.js on Vercel.png");
  });

  it("caps the name at 100 characters without splitting a character", () => {
    const name = pngFileName("😀".repeat(150), "light");
    expect(name).toBe(`${"😀".repeat(100)}.png`);
  });

  it("adds -dark for the dark image", () => {
    expect(pngFileName("Acme SaaS stack", "dark")).toBe("Acme SaaS stack-dark.png");
    expect(pngFileName(" /?. ", "dark")).toBe("stack-diagram-dark.png");
  });

  it("falls back when nothing is left", () => {
    expect(pngFileName(" /?. ", "light")).toBe("stack-diagram.png");
  });
});

describe("shareData", () => {
  it("shares the title and the stack page URL", () => {
    expect(shareData({ id: "abc_DEF-1", title: "Acme" }, "https://stacks.caru.moe")).toEqual({
      title: "Acme",
      url: "https://stacks.caru.moe/s/abc_DEF-1",
    });
  });

  it("ignores the current path", () => {
    expect(shareData({ id: "x", title: "X" }, "http://localhost:5173").url).toBe(
      "http://localhost:5173/s/x",
    );
  });
});
