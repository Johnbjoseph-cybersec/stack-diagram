import { describe, expect, it, vi } from "vite-plus/test";

import { sha256Bytes } from "@/lib/crypto.ts";
import type { SubmissionMode } from "@/lib/settings.ts";

import { type Accepted, type IntakeDeps, MAX_BODY_BYTES, PROOF_HEADER, intake } from "./intake.ts";
import { issueChallenge, leadingZeroBits } from "./pow.ts";
import { pngBytes } from "./test-png.ts";

const SECRET = "pow-secret";
const BITS = 4;
const NOW = 1_800_000_000_000;
const META = { title: "Stack", name: "caru", stack: [{ name: "Hono" }] };

async function solvedProof() {
  const challenge = await issueChallenge(SECRET, NOW);
  for (let n = 0; ; n++) {
    const proof = `${challenge}:${n}`;
    if (leadingZeroBits(await sha256Bytes(proof)) >= BITS) {
      return proof;
    }
  }
}

function fakes() {
  return {
    mode: vi.fn(async (): Promise<SubmissionMode> => "open"),
    limit: vi.fn(async () => true),
    pow: { secret: SECRET, bits: BITS, now: NOW },
    useChallenge: vi.fn(async (_challenge: string) => true),
    postsToday: vi.fn(async () => ({ total: 0, mine: 0 })),
    dailyLimit: 200,
    dailyLimitPerIp: 5,
    publish: vi.fn(async (_post: Accepted) => new Response(null, { status: 201 })),
  } satisfies IntakeDeps;
}

type Post = {
  proof?: string;
  meta?: unknown;
  light?: Uint8Array<ArrayBuffer>;
  dark?: Uint8Array<ArrayBuffer>;
  contentLength?: string | null;
};

async function post({ proof, meta = META, light, dark, contentLength }: Post = {}) {
  const form = new FormData();
  form.set("meta", JSON.stringify(meta));
  form.set("light", new Blob([light ?? pngBytes(800, 600)]), "light.png");
  form.set("dark", new Blob([dark ?? pngBytes(800, 600)]), "dark.png");
  const encoded = new Response(form);
  const body = await encoded.arrayBuffer();
  const headers = new Headers({
    "content-type": encoded.headers.get("content-type") ?? "",
    [PROOF_HEADER]: proof ?? (await solvedProof()),
  });
  if (contentLength !== null) {
    headers.set("content-length", contentLength ?? String(body.byteLength));
  }
  return new Request("https://gallery.test/api/stacks", { method: "POST", body, headers });
}

describe("intake", () => {
  it("hands a post that passes every check to publish", async () => {
    const deps = fakes();
    const response = await intake(await post({ meta: { ...META, github: "octocat" } }), deps);
    expect(response.status).toBe(201);
    expect(deps.publish).toHaveBeenCalledTimes(1);
    expect(deps.publish.mock.calls[0]?.[0]).toMatchObject({
      mode: "open",
      meta: { ...META, github: "octocat" },
      width: 800,
      height: 600,
    });
  });

  it("stops before the body and every costly step when a cheap check fails", async () => {
    const cases: [string, (deps: ReturnType<typeof fakes>) => void, Post, number][] = [
      ["closed", (deps) => deps.mode.mockResolvedValue("closed"), {}, 503],
      ["rate limited", (deps) => deps.limit.mockResolvedValue(false), {}, 429],
      ["no Content-Length", () => {}, { contentLength: null }, 411],
      ["large Content-Length", () => {}, { contentLength: String(MAX_BODY_BYTES + 1) }, 413],
      ["no proof", () => {}, { proof: "" }, 400],
      ["used challenge", (deps) => deps.useChallenge.mockResolvedValue(false), {}, 409],
      [
        "gallery cap",
        (deps) => deps.postsToday.mockResolvedValue({ total: 200, mine: 0 }),
        {},
        429,
      ],
      ["address cap", (deps) => deps.postsToday.mockResolvedValue({ total: 9, mine: 5 }), {}, 429],
    ];
    for (const [name, arrange, request, status] of cases) {
      const deps = fakes();
      arrange(deps);
      const sent = await post(request);
      const response = await intake(sent, deps);
      expect([name, response.status]).toEqual([name, status]);
      expect([name, sent.bodyUsed]).toEqual([name, false]);
      expect(deps.publish).not.toHaveBeenCalled();
    }
  });

  it("checks in order, so a failure skips the checks after it", async () => {
    const deps = fakes();
    deps.limit.mockResolvedValue(false);
    await intake(await post(), deps);
    expect(deps.mode).not.toHaveBeenCalled();
    expect(deps.useChallenge).not.toHaveBeenCalled();
    expect(deps.postsToday).not.toHaveBeenCalled();
    const invalid = fakes();
    await intake(await post({ proof: "nope" }), invalid);
    expect(invalid.useChallenge).not.toHaveBeenCalled();
    expect(invalid.postsToday).not.toHaveBeenCalled();
    const capped = fakes();
    capped.postsToday.mockResolvedValue({ total: 9, mine: 5 });
    await intake(await post(), capped);
    expect(capped.useChallenge).not.toHaveBeenCalled();
  });

  it("caps the body it reads whatever Content-Length says", async () => {
    const deps = fakes();
    const huge = pngBytes(800, 600, MAX_BODY_BYTES);
    const response = await intake(await post({ light: huge, contentLength: "1000" }), deps);
    expect(response.status).toBe(413);
    expect(deps.publish).not.toHaveBeenCalled();
  });

  it("refuses bad meta and oversized PNGs before publish", async () => {
    const cases: [Post, number][] = [
      [{ meta: { ...META, title: "" } }, 400],
      [{ light: pngBytes(800, 600, 1024 * 1024 + 1) }, 413],
      [{ light: pngBytes(4001, 600), dark: pngBytes(4001, 600) }, 413],
      [{ light: pngBytes(3000, 3000), dark: pngBytes(3000, 3000) }, 413],
      [{ dark: pngBytes(800, 601) }, 400],
    ];
    for (const [request, status] of cases) {
      const deps = fakes();
      const response = await intake(await post(request), deps);
      expect(response.status).toBe(status);
      expect(deps.publish).not.toHaveBeenCalled();
    }
  });
});
