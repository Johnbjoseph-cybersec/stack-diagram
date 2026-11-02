import { describe, expect, it } from "vite-plus/test";

import { formatDate } from "./format.ts";

describe("formatDate", () => {
  it("writes the date with dots and zero padding", () => {
    expect(formatDate("2026-01-05T09:30:00.000Z")).toBe("2026.01.05");
  });

  it("reads the date in UTC", () => {
    expect(formatDate("2026-10-31T23:30:00.000Z")).toBe("2026.10.31");
    expect(formatDate("2026-11-01T08:00:00+09:00")).toBe("2026.10.31");
  });
});
