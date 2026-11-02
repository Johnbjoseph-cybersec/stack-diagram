import type { stacks } from "./db/schema.ts";

export type Theme = "light" | "dark";

export type PublicStackItem = {
  name: string;
  icon: string | null;
  iconDark: string | null;
  wide: boolean;
};

/** The only shape of a post that leaves the server; GitHub login, IP hash and delete key never do. */
export type PublicStack = {
  id: string;
  title: string;
  name: string;
  stack: PublicStackItem[];
  score: number;
  width: number;
  height: number;
  createdAt: string;
  images: Record<Theme, string>;
};

export const stackImageKey = (id: string, theme: Theme) => `stacks/${id}/${theme}.webp`;

export const fileUrl = (key: string) => `/files/${key}`;

export function toPublicStack(row: typeof stacks.$inferSelect): PublicStack {
  return {
    id: row.id,
    title: row.title,
    name: row.name,
    stack: row.stack.map((item) => ({
      name: item.name,
      icon: item.iconKey ? fileUrl(item.iconKey) : null,
      iconDark: item.iconDarkKey ? fileUrl(item.iconDarkKey) : null,
      wide: item.wide,
    })),
    score: row.score,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
    images: {
      light: fileUrl(stackImageKey(row.id, "light")),
      dark: fileUrl(stackImageKey(row.id, "dark")),
    },
  };
}
