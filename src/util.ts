import LinkedList from './linked-list.js';
import { IList } from './types.js';

export const WRONGTYPE_ERROR =
  'WRONGTYPE Operation against a key holding the wrong kind of value' as const;

export function getNumberFromString(value: string): number | undefined {
  if (value.trim() === '') return undefined;

  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : undefined;
}

export function getIntFromString(value: string): number | undefined {
  if (value.trim() === '') return undefined;

  const parsed = parseInt(value, 10);
  return !isNaN(parsed) ? parsed : undefined;
}

export function isStringDataType(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

export function isListDataType(value: unknown): value is IList<string> {
  return (
    value !== null && typeof value === 'object' && value instanceof LinkedList
  );
}

export function isSetDataType(value: unknown): value is Set<string> {
  return value !== null && typeof value === 'object' && value instanceof Set;
}
