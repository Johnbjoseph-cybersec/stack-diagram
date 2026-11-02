import { describe, expect, it } from "vite-plus/test";

import { decodeCursor, encodeCursor, orderKey, parseListQuery, type Position } from "./params.ts";

const position: Position = { score: 7, createdAt: "1793500000123456", id: "abc_DEF-1" };

const encode = (value: unknown) =>
  btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

describe("orderKey", () => {
  it("orders top by score, then creation time, then id", () => {
    expect(orderKey("top", position)).toEqual([7, "1793500000123456", "abc_DEF-1"]);
  });

  it("orders new by creation time, then id", () => {
    expect(orderKey("new", position)).toEqual(["1793500000123456", "abc_DEF-1"]);
  });
});

describe("cursor", () => {
  it("round-trips a top cursor", () => {
    expect(decodeCursor("top", encodeCursor("top", position))).toEqual({
      sort: "top",
      ...position,
    });
  });

  it("round-trips a new cursor without the score", () => {
    expect(decodeCursor("new", encodeCursor("new", position))).toEqual({
      sort: "new",
      createdAt: position.createdAt,
      id: position.id,
    });
  });

  it("is URL-safe", () => {
    expect(encodeCursor("top", { ...position, id: "é?/+" })).toMatch(/^[\w-]+$/);
  });

  it("rejects a cursor made for the other sort", () => {
    expect(decodeCursor("new", encodeCursor("top", position))).toBeNull();
    expect(decodeCursor("top", encodeCursor("new", position))).toBeNull();
  });

  it.each([
    ["empty", ""],
    ["not base64url", "a+b/c="],
    ["not JSON", encode("x").slice(0, -2)],
    ["an object", encode({ score: 1, createdAt: "1", id: "a" })],
    ["a fractional score", encode([1.5, "1", "a"])],
    ["a score beyond int32", encode([2 ** 31, "1", "a"])],
    ["a numeric time", encode([1, 1, "a"])],
    ["a negative time", encode([1, "-1", "a"])],
    ["a time with 17 digits", encode([1, "12345678901234567", "a"])],
    ["an id with a slash", encode([1, "1", "a/b"])],
    ["an extra element", encode([1, "1", "a", "b"])],
    ["a long cursor", "a".repeat(201)],
  ])("rejects %s", (_, cursor) => {
    expect(decodeCursor("top", cursor)).toBeNull();
  });
});

const parse = (query: string) => parseListQuery(new URLSearchParams(query));

describe("parseListQuery", () => {
  it("defaults to the top 24", () => {
    expect(parse("")).toEqual({ sort: "top", limit: 24 });
  });

  it("lowercases the tech and keeps every valid parameter", () => {
    const cursor = encodeCursor("new", position);
    expect(parse(`sort=new&tech=Next.js&cursor=${cursor}&limit=48&include=techs`)).toEqual({
      sort: "new",
      tech: "next.js",
      cursor,
      limit: 48,
      include: "techs",
    });
  });

  it("accepts techs such as C++ and C#", () => {
    expect(parse("tech=c%2B%2B")?.tech).toBe("c++");
    expect(parse("tech=C%23")?.tech).toBe("c#");
  });

  it.each([
    ["an unknown parameter", "utm_source=x"],
    ["a repeated parameter", "sort=top&sort=new"],
    ["an unknown sort", "sort=hot"],
    ["a limit outside 12, 24 and 48", "limit=25"],
    ["an unknown include", "include=all"],
    ["an empty tech", "tech="],
    ["a tech starting with a space", "tech=%20react"],
    ["a tech with a slash", "tech=a/b"],
    ["a tech over 40 characters", `tech=${"a".repeat(41)}`],
    ["a cursor for the other sort", `sort=top&cursor=${encodeCursor("new", position)}`],
    ["a broken cursor", "cursor=abc"],
  ])("rejects %s", (_, query) => {
    expect(parse(query)).toBeNull();
  });
});
