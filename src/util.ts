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

/**
 * Convert a Redis glob pattern to a RegExp
 * Supports:
 * - * : matches any sequence of characters
 * - ? : matches any single character
 * - [abc] : matches any character in the set
 * - [^abc] : matches any character not in the set
 * - [a-b] : matches any character in the range
 * - \ : escapes special characters
 */
export function globPatternToRegex(pattern: string): RegExp {
  let regex = '';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '\\' && i + 1 < pattern.length) {
      // Escape next character
      regex += escapeRegexChar(pattern[i + 1]);
      i += 2;
    } else if (char === '*') {
      // Match any sequence of characters
      regex += '.*';
      i++;
    } else if (char === '?') {
      // Match any single character
      regex += '.';
      i++;
    } else if (char === '[') {
      // Character class, handle escaped closing brackets
      let j = i + 1;
      let found = false;
      while (j < pattern.length) {
        if (pattern[j] === '\\' && j + 1 < pattern.length) {
          // Skip escaped character
          j += 2;
        } else if (pattern[j] === ']') {
          found = true;
          break;
        } else {
          j++;
        }
      }
      if (!found) {
        // No closing bracket, treat as literal
        regex += escapeRegexChar(char);
        i++;
      } else {
        const classContent = pattern.substring(i + 1, j);
        regex += '[' + classContent + ']';
        i = j + 1;
      }
    } else {
      // Regular character, escape if needed
      regex += escapeRegexChar(char);
      i++;
    }
  }

  return new RegExp(`^${regex}$`);
}

function escapeRegexChar(char: string): string {
  const specials = [
    '.',
    '+',
    '^',
    '$',
    '|',
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    '\\',
  ];
  if (specials.includes(char)) {
    return '\\' + char;
  }
  return char;
}
