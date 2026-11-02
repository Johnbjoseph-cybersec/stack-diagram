export function intVar(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
