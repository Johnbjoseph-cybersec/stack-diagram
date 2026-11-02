import { and, arrayContains, desc, eq, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/client.ts";
import { type StackItem, stacks } from "@/lib/db/schema.ts";
import { fileUrl, type PublicStack, toPublicStack } from "@/lib/public-stack.ts";

import { type Cursor, decodeCursor, encodeCursor, type Sort, TECH_PATTERN } from "./params.ts";

export type GalleryPage = { items: PublicStack[]; nextCursor: string | null };

export type TechCount = {
  key: string;
  name: string;
  count: number;
  icon: string | null;
  wide: boolean;
};

const ORDER_BY = {
  top: [desc(stacks.score), desc(stacks.createdAt), desc(stacks.id)],
  new: [desc(stacks.createdAt), desc(stacks.id)],
};

const createdAtMicros = sql<string>`(extract(epoch from ${stacks.createdAt}) * 1000000)::bigint::text`;

const fromMicros = (micros: string) =>
  sql`timestamptz 'epoch' + ${micros}::bigint * interval '1 microsecond'`;

const after = (cursor: Cursor) =>
  cursor.sort === "top"
    ? sql`(${stacks.score}, ${stacks.createdAt}, ${stacks.id}) < (${cursor.score}, ${fromMicros(cursor.createdAt)}, ${cursor.id})`
    : sql`(${stacks.createdAt}, ${stacks.id}) < (${fromMicros(cursor.createdAt)}, ${cursor.id})`;

export async function listStacks(
  db: Db,
  { sort, tech, cursor, limit }: { sort: Sort; tech?: string; cursor?: string; limit: number },
): Promise<GalleryPage> {
  const position = cursor === undefined ? undefined : decodeCursor(sort, cursor);
  if (position === null) {
    throw new Error("Invalid cursor");
  }
  const rows = await db
    .select({ row: stacks, createdAt: createdAtMicros })
    .from(stacks)
    .where(
      and(
        eq(stacks.status, "published"),
        tech === undefined ? undefined : arrayContains(stacks.stackKeys, [tech.toLowerCase()]),
        position === undefined ? undefined : after(position),
      ),
    )
    .orderBy(...ORDER_BY[sort])
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map(({ row }) => toPublicStack(row)),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor(sort, { score: last.row.score, createdAt: last.createdAt, id: last.row.id })
        : null,
  };
}

/** The most-used techs, named and drawn after their most common icon, then newest item; keys are lowercased item names. */
export async function topTechs(db: Db, limit = 12): Promise<{ techs: TechCount[]; total: number }> {
  const [techs, total] = await Promise.all([
    db.execute<{ key: string; count: number; item: StackItem | null }>(sql`
      select t.key, t.count, rep.item
      from (
        select k.key, count(distinct s.id)::int as count
        from ${stacks} s cross join lateral unnest(s.stack_keys) as k(key)
        where s.status = 'published' and k.key ~ ${TECH_PATTERN.source}
        group by k.key
        order by count desc, k.key
        limit ${limit}
      ) t
      left join lateral (
        select i.item
        from ${stacks} s cross join lateral jsonb_array_elements(s.stack) as i(item)
        where s.status = 'published'
          and s.stack_keys @> array[t.key]
          and lower(btrim(i.item->>'name')) = t.key
        order by (i.item->>'iconKey') is null,
          count(*) over (partition by i.item->>'iconKey') desc,
          s.created_at desc
        limit 1
      ) rep on true
      order by t.count desc, t.key
    `),
    db.$count(stacks, eq(stacks.status, "published")),
  ]);
  return {
    techs: techs.rows.map(({ key, count, item }) => ({
      key,
      name: item?.name ?? key,
      count,
      icon: item?.iconKey ? fileUrl(item.iconKey) : null,
      wide: item?.wide ?? false,
    })),
    total,
  };
}
