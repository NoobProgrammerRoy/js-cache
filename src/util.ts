export function getNumberFromString(value: string): number | undefined {
  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : undefined;
}
