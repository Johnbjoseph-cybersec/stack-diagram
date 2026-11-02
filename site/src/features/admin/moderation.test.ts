import { expect, test } from "vite-plus/test";

import { type Action, canModerate, type Status } from "./moderation.ts";

const cases: [Status, number, Action, boolean][] = [
  ["held", 0, "publish", true],
  ["hidden", 3, "publish", true],
  ["published", 0, "publish", false],
  ["published", 2, "keep", true],
  ["published", 0, "keep", false],
  ["held", 1, "keep", false],
  ["hidden", 3, "keep", false],
  ["held", 0, "hide", true],
  ["published", 1, "hide", true],
  ["hidden", 3, "hide", true],
  ["hidden", 0, "hide", false],
  ["held", 0, "delete", true],
  ["published", 0, "delete", true],
  ["hidden", 3, "delete", true],
];

test.each(cases)("%s with %i reports, %s → %s", (status, reports, action, allowed) => {
  expect(canModerate({ status, reports }, action)).toBe(allowed);
});
