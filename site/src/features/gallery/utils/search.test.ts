import { describe, expect, it } from "vite-plus/test";

import type { PublicStack } from "@/lib/public-stack.ts";

import { appendPage, GallerySearch, listUrl } from "./search.ts";

const parse = (search: Record<string, unknown>) => GallerySearch.parse(search);

describe("GallerySearch", () => {
  it("defaults to the top sort without a tech", () => {
    expect(parse({})).toEqual({ sort: "top" });
  });

  it("keeps a valid sort and lowercases the tech", () => {
    expect(parse({ sort: "new", tech: "Next.js" })).toEqual({ sort: "new", tech: "next.js" });
  });

  it("accepts techs such as C++ and C#", () => {
    expect(parse({ tech: "C++" }).tech).toBe("c++");
    expect(parse({ tech: "c#" }).tech).toBe("c#");
  });

  it.each([
    ["an unknown sort", { sort: "hot" }],
    ["a numeric sort", { sort: 1 }],
  ])("falls back to top on %s", (_, search) => {
    expect(parse(search).sort).toBe("top");
  });

  it.each([
    ["an empty tech", ""],
    ["a tech with a slash", "a/b"],
    ["a tech starting with a space", " react"],
    ["a tech over 40 characters", "a".repeat(41)],
    ["a number", 42],
  ])("drops %s", (_, tech) => {
    expect(parse({ tech })).toEqual({ sort: "top" });
  });

  it("drops unknown parameters", () => {
    expect(parse({ utm_source: "x" })).toEqual({ sort: "top" });
  });
});

describe("listUrl", () => {
  it("asks for the next 24 after the cursor", () => {
    expect(listUrl({ sort: "top", cursor: "abc" })).toBe(
      "/api/stacks?sort=top&cursor=abc&limit=24",
    );
  });

  it("puts the tech between the sort and the cursor, encoded", () => {
    expect(listUrl({ sort: "new", tech: "c++", cursor: "abc" })).toBe(
      "/api/stacks?sort=new&tech=c%2B%2B&cursor=abc&limit=24",
    );
  });
});

const stack = (id: string): PublicStack => ({
  id,
  title: id,
  name: "someone",
  stack: [],
  score: 0,
  width: 1400,
  height: 800,
  createdAt: "2026-11-01T00:00:00.000Z",
  images: { light: `/files/stacks/${id}/light.webp`, dark: `/files/stacks/${id}/dark.webp` },
});

describe("appendPage", () => {
  it("adds the next page after the current items", () => {
    expect(appendPage([stack("a")], [stack("b"), stack("c")]).map(({ id }) => id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("skips posts that are already shown", () => {
    expect(
      appendPage([stack("a"), stack("b")], [stack("b"), stack("c")]).map(({ id }) => id),
    ).toEqual(["a", "b", "c"]);
  });
});
