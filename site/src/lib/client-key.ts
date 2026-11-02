import { hmac } from "./crypto.ts";

function expandIpv6(ip: string) {
  const [head = "", tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const missing = tail === undefined ? 0 : 8 - left.length - right.length;
  return [...left, ...Array.from({ length: missing }, () => "0"), ...right];
}

/** One key per IPv4 address or IPv6 /64, since a single host usually owns a whole /64. */
export function networkOf(ip: string) {
  return ip.includes(":") ? `${expandIpv6(ip).slice(0, 4).join(":")}::/64` : ip;
}

export const clientKey = (request: Request, secret: string) =>
  hmac(secret, networkOf(request.headers.get("cf-connecting-ip") ?? "unknown"));
