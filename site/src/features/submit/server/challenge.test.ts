import { describe, expect, test, vi } from "vite-plus/test";

const mocked = vi.hoisted(() => ({ env: {} as { POW_BITS?: string } }));
vi.mock("cloudflare:workers", () => mocked);

const { powBits } = await import("./challenge.ts");

// scripts/share.py refuses any challenge above MAX_BITS, since a 27-bit solve outlives the 10-minute TTL.
const SHARE_PY_MAX_BITS = 26;

describe("powBits", () => {
  test("defaults to 20", () => {
    mocked.env.POW_BITS = undefined;
    expect(powBits()).toBe(20);
  });

  test("honours a valid POW_BITS", () => {
    mocked.env.POW_BITS = "24";
    expect(powBits()).toBe(24);
  });

  test("ignores a non-integer POW_BITS", () => {
    mocked.env.POW_BITS = "abc";
    expect(powBits()).toBe(20);
  });

  test("never issues more bits than share.py can solve", () => {
    mocked.env.POW_BITS = "32";
    expect(powBits()).toBeLessThanOrEqual(SHARE_PY_MAX_BITS);
  });
});
