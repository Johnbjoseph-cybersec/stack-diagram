import type { Theme } from "@/lib/public-stack.ts";

const UNSAFE_IN_FILE_NAMES = /[\p{Cc}"*/:<>?\\|]/gu;
const MAX_NAME_LENGTH = 100;

/** The title as a file name that every OS accepts. */
export function pngFileName(title: string, theme: Theme) {
  const clean = title.replace(UNSAFE_IN_FILE_NAMES, " ").replace(/\s+/g, " ").trim();
  const name = Array.from(new Intl.Segmenter().segment(clean), ({ segment }) => segment)
    .slice(0, MAX_NAME_LENGTH)
    .join("")
    .replace(/[\s.]+$/, "");
  return `${name || "stack-diagram"}${theme === "dark" ? "-dark" : ""}.png`;
}

export const shareData = ({ id, title }: { id: string; title: string }, origin: string) => ({
  title,
  url: new URL(`/s/${encodeURIComponent(id)}`, origin).href,
});
