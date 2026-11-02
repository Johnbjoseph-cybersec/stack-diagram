import { describe, expect, it } from "vite-plus/test";

import { diagramSize, pngSize } from "./png.ts";
import { pngBytes } from "./test-png.ts";

describe("pngSize", () => {
  it("reads the width and height from IHDR", () => {
    expect(pngSize(pngBytes(1600, 900))).toEqual({ width: 1600, height: 900 });
  });

  it("refuses a short file, another signature, or a first chunk other than IHDR", () => {
    expect(pngSize(pngBytes(1600, 900).subarray(0, 23))).toBeNull();
    const gif = pngBytes(1600, 900);
    gif.set([0x47, 0x49, 0x46, 0x38]);
    expect(pngSize(gif)).toBeNull();
    const idat = pngBytes(1600, 900);
    idat.set([0x49, 0x44, 0x41, 0x54], 12);
    expect(pngSize(idat)).toBeNull();
  });
});

describe("diagramSize", () => {
  it("passes a light and dark pair of the same size", () => {
    expect(diagramSize(pngBytes(4000, 2000), pngBytes(4000, 2000))).toEqual({
      ok: true,
      width: 4000,
      height: 2000,
    });
  });

  it("refuses more than 4000px a side or 8 megapixels with 413", () => {
    for (const [width, height] of [
      [4001, 100],
      [100, 4001],
      [3000, 3000],
    ] as const) {
      expect(diagramSize(pngBytes(width, height), pngBytes(width, height))).toMatchObject({
        ok: false,
        status: 413,
      });
    }
    expect(diagramSize(pngBytes(800, 600), pngBytes(1, 1_000_000_000))).toMatchObject({
      status: 413,
    });
  });

  it("refuses a mismatched pair, a tiny image, or a file that is not a PNG", () => {
    expect(diagramSize(pngBytes(800, 600), pngBytes(800, 601))).toMatchObject({ status: 400 });
    expect(diagramSize(pngBytes(15, 600), pngBytes(15, 600))).toMatchObject({ status: 400 });
    expect(diagramSize(new Uint8Array(33), pngBytes(800, 600))).toMatchObject({ status: 400 });
  });
});
