import { expect, test } from "vite-plus/test";

import { postMeta } from "./labels.ts";

test("a published post shows its votes", () => {
  expect(postMeta({ status: "published", score: 128, reports: 0 })).toBe("128 votes");
  expect(postMeta({ status: "published", score: 1, reports: 0 })).toBe("1 vote");
  expect(postMeta({ status: "published", score: 0, reports: 2 })).toBe("0 votes");
  expect(postMeta({ status: "published", score: -1, reports: 0 })).toBe("-1 vote");
});

test("a held post is not public yet", () => {
  expect(postMeta({ status: "held", score: 0, reports: 0 })).toBe("Not public yet");
});

test("a hidden post says how many reports hid it", () => {
  expect(postMeta({ status: "hidden", score: 4, reports: 3 })).toBe("Hidden after 3 reports");
  expect(postMeta({ status: "hidden", score: 0, reports: 1 })).toBe("Hidden after 1 report");
});

test("a post an admin hid without reports has no note", () => {
  expect(postMeta({ status: "hidden", score: 0, reports: 0 })).toBeNull();
});
