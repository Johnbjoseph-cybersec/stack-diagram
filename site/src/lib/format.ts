const pad = (value: number) => String(value).padStart(2, "0");

/** "2026-11-01T…Z" → "2026.11.01", read in UTC so server and browser agree. */
export function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
}
