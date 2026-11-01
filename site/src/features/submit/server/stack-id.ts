const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const LENGTH = 10;

export const STACK_ID = /^[0-9A-Za-z]{10}$/;

export function newStackId() {
  let id = "";
  while (id.length < LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(LENGTH * 2))) {
      // 248 is 4 × 62; skipping larger bytes keeps every character equally likely.
      if (byte < 248 && id.length < LENGTH) {
        id += BASE62.charAt(byte % 62);
      }
    }
  }
  return id;
}
