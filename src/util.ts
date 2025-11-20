import { TListDataType, TStringDataType } from './types.js';

export const WRONGTYPE_ERROR =
  'WRONGTYPE Operation against a key holding the wrong kind of value' as const;

export function getNumberFromString(value: string): number | undefined {
  if (value.trim() === '') return undefined;

  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : undefined;
}

export function isStringDataType(value: unknown): value is TStringDataType {
  return typeof value === 'string' || typeof value === 'number';
}

export function isListDataType(value: unknown): value is TListDataType {
  return value !== null && typeof value === 'object' && 'lPush' in value;
}
