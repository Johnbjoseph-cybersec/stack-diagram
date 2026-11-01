export const MAX_PNG_BYTES = 1024 * 1024;
export const MIN_SIDE = 16;
// A 1 MB PNG can inflate to gigabytes of pixels, so size is judged from the header alone.
export const MAX_SIDE = 4000;
export const MAX_PIXELS = 8_000_000;

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IHDR = [0x49, 0x48, 0x44, 0x52];

/** Width and height from the IHDR chunk, which the PNG spec puts first; null for anything else. */
export function pngSize(bytes: Uint8Array) {
  if (
    bytes.length < 24 ||
    SIGNATURE.some((byte, i) => bytes[i] !== byte) ||
    IHDR.some((byte, i) => bytes[12 + i] !== byte)
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13) {
    return null;
  }
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function diagramSize(
  light: Uint8Array,
  dark: Uint8Array,
): { ok: true; width: number; height: number } | { ok: false; status: number; error: string } {
  const lightSize = pngSize(light);
  const darkSize = pngSize(dark);
  if (!lightSize || !darkSize) {
    return { ok: false, status: 400, error: "light and dark must be PNG files" };
  }
  for (const { width, height } of [lightSize, darkSize]) {
    if (Math.max(width, height) > MAX_SIDE || width * height > MAX_PIXELS) {
      return {
        ok: false,
        status: 413,
        error: `The PNGs must be at most ${MAX_SIDE}px a side and 8 megapixels`,
      };
    }
  }
  if (lightSize.width !== darkSize.width || lightSize.height !== darkSize.height) {
    return { ok: false, status: 400, error: "The light and dark PNGs must be the same size" };
  }
  const { width, height } = lightSize;
  if (Math.min(width, height) < MIN_SIDE) {
    return { ok: false, status: 400, error: `The PNGs must be at least ${MIN_SIDE}px a side` };
  }
  return { ok: true, width, height };
}
