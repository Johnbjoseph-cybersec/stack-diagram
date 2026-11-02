import { z } from "zod";

const GITHUB_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

// Code points, not UTF-16 units, so an emoji counts once as it does in share.py.
const text = (max: number) =>
  z
    .string({ error: "must be text" })
    .trim()
    .refine((value) => {
      const length = Array.from(value).length;
      return length >= 1 && length <= max;
    }, `must be 1-${max} characters`);

const iconUrl = z.url({ error: "must be a URL" }).max(2048, "must be a URL").optional();

export const metaSchema = z.object(
  {
    title: text(80),
    name: text(40),
    stack: z
      .array(z.object({ name: text(40), icon: iconUrl, iconDark: iconUrl }), {
        error: "must be a list",
      })
      .min(1, "must list 1-24 technologies")
      .max(24, "must list 1-24 technologies"),
    github: z
      .string({ error: "is not a valid GitHub login" })
      .regex(GITHUB_LOGIN, "is not a valid GitHub login")
      .optional(),
  },
  { error: "must be a JSON object" },
);

export type Meta = z.infer<typeof metaSchema>;

export function parseMeta(raw: unknown): { ok: true; meta: Meta } | { ok: false; error: string } {
  let json: unknown = null;
  try {
    json = typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  const parsed = metaSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = ["meta", ...(issue?.path ?? []).map(String)].join(".");
    return { ok: false, error: `${where} ${issue?.message ?? "is invalid"}` };
  }
  return { ok: true, meta: parsed.data };
}
