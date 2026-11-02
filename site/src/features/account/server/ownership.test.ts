import { expect, test } from "vite-plus/test";

import { ownsPost } from "./ownership.ts";

test("the matching GitHub id owns the post", () => {
  expect(ownsPost({ githubId: "123" }, { githubId: "123" })).toBe(true);
});

test("another GitHub id does not", () => {
  expect(ownsPost({ githubId: "123" }, { githubId: "456" })).toBe(false);
});

test("an anonymous post has no owner", () => {
  expect(ownsPost({ githubId: null }, { githubId: "123" })).toBe(false);
});
