import { z } from "zod";

export const SORTS = ["top", "new"] as const;
export type Sort = (typeof SORTS)[number];

export const TECH_PATTERN = /^[a-z0-9][a-z0-9.+# -]{0,39}$/;

/** A row's place in a listing; `createdAt` is in epoch microseconds, which a JS Date cannot hold. */
export type Position = { score: number; createdAt: string; id: string };

export type Cursor =
  | { sort: "top"; score: number; createdAt: string; id: string }
  | { sort: "new"; createdAt: string; id: string };

const micros = z.string().regex(/^\d{1,16}$/);
const stackId = z.string().regex(/^[\w-]{1,64}$/);
const KEYS = {
  top: z.tuple([z.int32(), micros, stackId]),
  new: z.tuple([micros, stackId]),
};

export const orderKey = (sort: Sort, { score, createdAt, id }: Position) =>
  sort === "top" ? [score, createdAt, id] : [createdAt, id];

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const fromBase64Url = (text: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) =>
      char.charCodeAt(0),
    ),
  );

export const encodeCursor = (sort: Sort, position: Position) =>
  toBase64Url(JSON.stringify(orderKey(sort, position)));

export function decodeCursor(sort: Sort, cursor: string): Cursor | null {
  if (!/^[\w-]{1,200}$/.test(cursor)) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(fromBase64Url(cursor));
  } catch {
    return null;
  }
  if (sort === "top") {
    const key = KEYS.top.safeParse(json);
    return key.success
      ? { sort, score: key.data[0], createdAt: key.data[1], id: key.data[2] }
      : null;
  }
  const key = KEYS.new.safeParse(json);
  return key.success ? { sort, createdAt: key.data[0], id: key.data[1] } : null;
}

const tech = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(z.string().regex(TECH_PATTERN));

const withValidCursor = (query: { sort: Sort; cursor?: string | undefined }) =>
  query.cursor === undefined || decodeCursor(query.sort, query.cursor) !== null;

export const GalleryInput = z
  .strictObject({ sort: z.enum(SORTS), tech: tech.optional(), cursor: z.string().optional() })
  .refine(withValidCursor);

const ListQuery = z
  .strictObject({
    sort: z.enum(SORTS).default("top"),
    tech: tech.optional(),
    cursor: z.string().optional(),
    limit: z.enum(["12", "24", "48"]).default("24").transform(Number),
    include: z.literal("techs").optional(),
  })
  .refine(withValidCursor);

export type ListQuery = z.output<typeof ListQuery>;

/** Every parameter must be known, valid and given once, so junk URLs can't mint cache keys. */
export function parseListQuery(params: URLSearchParams): ListQuery | null {
  const entries = [...params];
  if (new Set(entries.map(([key]) => key)).size !== entries.length) {
    return null;
  }
  const query = ListQuery.safeParse(Object.fromEntries(entries));
  return query.success ? query.data : null;
}

/** An error whose status TanStack Start sends with the server function's reply. */
export const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

/** A server-function validator that answers 400 instead of 500 on bad input. */
export const strictInput =
  <T extends z.ZodType>(schema: T) =>
  (input: z.input<T>): z.output<T> => {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw httpError(400, "Invalid input");
    }
    return result.data;
  };
