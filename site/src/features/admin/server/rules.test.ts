import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vite-plus/test";

import { strikeTargets, tabWhere } from "./rules.ts";

const render = (tab: Parameters<typeof tabWhere>[0]) => {
  const condition = tabWhere(tab);
  if (!condition) {
    throw new Error("no condition");
  }
  return new PgDialect({ casing: "snake_case" }).sqlToQuery(condition);
};

describe("tabWhere", () => {
  test("queue holds held posts and reported posts, hidden or not", () => {
    expect(render("queue")).toMatchObject({
      sql: '("stacks"."status" = $1 or "stacks"."reports" > $2)',
      params: ["held", 0],
    });
  });

  test("other tabs match their status", () => {
    expect(render("hidden")).toMatchObject({ sql: '"stacks"."status" = $1', params: ["hidden"] });
    expect(render("published")).toMatchObject({
      sql: '"stacks"."status" = $1',
      params: ["published"],
    });
  });
});

describe("strikeTargets", () => {
  test("strikes each reporter once", () => {
    expect(
      strikeTargets([{ reporterHash: "a" }, { reporterHash: "b" }, { reporterHash: "a" }]),
    ).toEqual(["a", "b"]);
  });

  test("is empty without reports", () => {
    expect(strikeTargets([])).toEqual([]);
  });
});
