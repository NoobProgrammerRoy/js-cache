export function getNumberFromString(value: string): number | undefined {
  if (value === null || value === undefined || value.trim() === '')
    return undefined;

  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : undefined;
}
