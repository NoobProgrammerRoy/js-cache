import { RespError } from './error.js';
import LinkedList from './linked-list.js';
import { IList, IStore, TDataType, TRespType } from './types.js';
import {
  getIntFromString,
  getNumberFromString,
  globPatternToRegex,
  isListDataType,
  isSetDataType,
  isStringDataType,
  WRONGTYPE_ERROR,
} from './util.js';

function handleSet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SET command');

  const key = args[0];
  const value = args[1];
  let nx = false;
  let xx = false;
  let exSeconds: number | null = null;
  let pxMilliseconds: number | null = null;

  // Parse optional flags
  for (let i = 2; i < args.length; i++) {
    const flag = args[i].toUpperCase();

    if (flag === 'NX') nx = true;
    else if (flag === 'XX') xx = true;
    else if (flag === 'EX') {
      if (i + 1 >= args.length)
        throw new RespError('syntax error for SET command');

      const seconds = getIntFromString(args[i + 1]);

      if (seconds === undefined || seconds <= 0)
        throw new RespError('value is not an integer or out of range');

      exSeconds = seconds;
      i++; // Skip the next argument (the value)
    } else if (flag === 'PX') {
      if (i + 1 >= args.length)
        throw new RespError('syntax error for SET command');

      const milliseconds = getIntFromString(args[i + 1]);

      if (milliseconds === undefined || milliseconds <= 0)
        throw new RespError('value is not an integer or out of range');

      pxMilliseconds = milliseconds;
      i++; // Skip the next argument (the value)
    } else {
      throw new RespError(`syntax error for SET command`);
    }
  }

  // NX and XX are mutually exclusive
  if (nx && xx) {
    throw new RespError(
      `syntax error: NX and XX options at the same time are not compatible`
    );
  }

  // EX and PX are mutually exclusive
  if (exSeconds !== null && pxMilliseconds !== null) {
    throw new RespError(
      `syntax error: EX and PX options at the same time are not compatible`
    );
  }

  const isExistingKey = store.has(key);

  if (nx && isExistingKey) return null;
  if (xx && !isExistingKey) return null;

  if (getNumberFromString(value) !== undefined) store.set(key, Number(value));
  else store.set(key, value);

  if (exSeconds !== null) {
    const expirationTimeMs = Date.now() + exSeconds * 1000;
    store.setExpiration(key, expirationTimeMs);
  } else if (pxMilliseconds !== null) {
    const expirationTimeMs = Date.now() + pxMilliseconds;
    store.setExpiration(key, expirationTimeMs);
  }

  return 'OK';
}

function handleMset(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2 || args.length % 2 !== 0)
    throw new RespError('wrong number of arguments for MSET command');

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (getNumberFromString(value) !== undefined) store.set(key, Number(value));
    else store.set(key, value);
  }

  return 'OK';
}

function handleGet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for GET command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;
  if (!isStringDataType(value)) throw new RespError(WRONGTYPE_ERROR);
  if (typeof value === 'number') return value.toString();

  return value;
}

function handleMget(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for MGET command');

  const result: TRespType[] = [];

  for (const key of args) {
    const value = store.get(key);

    if (value === undefined) result.push(null);
    else if (!isStringDataType(value)) result.push(null);
    else if (typeof value === 'number') result.push(value.toString());
    else result.push(value);
  }

  return result;
}

function handleStrlen(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for STRLEN command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return 0;
  if (!isStringDataType(value)) throw new RespError(WRONGTYPE_ERROR);
  if (typeof value === 'number') return value.toString().length;

  return value.length;
}

function handleGetRange(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 3)
    throw new RespError('wrong number of arguments for GETRANGE command');

  const key = args[0];
  const startStr = args[1];
  const endStr = args[2];

  const start = getIntFromString(startStr);
  const end = getIntFromString(endStr);

  if (start === undefined)
    throw new RespError('value is not an integer or out of range');
  if (end === undefined)
    throw new RespError('value is not an integer or out of range');

  const value = store.get(key);

  if (value === undefined) return '';
  if (!isStringDataType(value)) throw new RespError(WRONGTYPE_ERROR);

  // Convert value to string (handles both string and number types)
  const str = typeof value === 'number' ? value.toString() : value;
  const len = str.length;

  // Handle negative indices
  let startIdx = start < 0 ? Math.max(0, len + start) : Math.min(start, len);
  let endIdx = end < 0 ? Math.max(-1, len + end) : Math.min(end, len - 1);

  // If start > end, return empty string
  if (startIdx > endIdx) return '';

  // Extract substring (endIdx is inclusive, so we add 1)
  return str.substring(startIdx, endIdx + 1);
}

function handleSetRange(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 3)
    throw new RespError('wrong number of arguments for SETRANGE command');

  const key = args[0];
  const offsetStr = args[1];
  const valueToSet = args[2];

  const offset = getIntFromString(offsetStr);

  if (offset === undefined || offset < 0)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  // Convert current value to string (or empty string if non-existent)
  let str = '';

  if (currentValue !== undefined)
    str =
      typeof currentValue === 'number' ? currentValue.toString() : currentValue;

  // If offset is beyond current length, pad with null bytes
  if (offset > str.length) str = str + '\x00'.repeat(offset - str.length);

  // Overwrite from offset to offset + valueToSet.length
  const before = str.substring(0, offset);
  const after = str.substring(offset + valueToSet.length);
  const newValue = before + valueToSet + after;

  store.set(key, newValue);

  return newValue.length;
}

function handleGetDel(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for GETDEL command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;
  if (!isStringDataType(value)) throw new RespError(WRONGTYPE_ERROR);

  store.delete(key);

  if (typeof value === 'number') return value.toString();

  return value;
}

function handleAppend(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for APPEND command');

  const key = args[0];
  const valueToAppend = args[1];
  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let newValue: string;

  if (currentValue === undefined) newValue = valueToAppend;
  else if (typeof currentValue === 'number')
    newValue = currentValue.toString().concat(valueToAppend);
  else newValue = currentValue.concat(valueToAppend);

  store.set(key, newValue);

  return newValue.length;
}

function handleDel(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for DEL command');

  return args.filter((key) => store.delete(key)).length;
}

function handleExists(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for EXISTS command');

  return args.filter((key) => store.has(key)).length;
}

function handleKeys(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for KEYS command');

  const pattern = args[0];
  const regex = globPatternToRegex(pattern);
  const allKeys = store.keys();

  return allKeys.filter((key) => regex.test(key));
}

function handleType(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for TYPE command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return 'none';
  if (isStringDataType(value)) return 'string';
  if (isListDataType(value)) return 'list';
  if (isSetDataType(value)) return 'set';

  return 'none';
}

function handleFlushall(store: IStore<string, TDataType>, _args: string[]) {
  store.clear();

  return 'OK';
}

function handlePing(_store: IStore<string, TDataType>, args: string[]) {
  if (args.length === 0) return 'PONG';

  return args.reduce((acc, curr, idx) => acc + (idx > 0 ? ' ' : '') + curr, '');
}

function handleEcho(_store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for ECHO command');

  return args[0];
}

function handleRename(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for RENAME command');

  const oldKey = args[0];
  const newKey = args[1];

  if (!store.has(oldKey)) throw new RespError('ERR no such key');
  if (oldKey === newKey) return 'OK';

  const value = store.get(oldKey);

  store.set(newKey, value!);
  store.delete(oldKey);

  return 'OK';
}

function handleIncr(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for INCR command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let newValue: number;

  if (currentValue === undefined) newValue = 1;
  else if (
    typeof currentValue === 'number' ||
    getIntFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) + 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleIncrby(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for INCRBY command');

  const key = args[0];
  const incrementStr = args[1];

  const increment = getIntFromString(incrementStr);

  if (increment === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let newValue: number;

  if (currentValue === undefined) newValue = increment;
  else if (
    typeof currentValue === 'number' ||
    getIntFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) + increment;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleDecr(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for DECR command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let newValue: number;

  if (currentValue === undefined) newValue = -1;
  else if (
    typeof currentValue === 'number' ||
    getIntFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) - 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleDecrby(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for DECRBY command');

  const key = args[0];
  const decrementStr = args[1];

  const decrement = getIntFromString(decrementStr);

  if (decrement === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let newValue: number;

  if (currentValue === undefined) newValue = -decrement;
  else if (
    typeof currentValue === 'number' ||
    getIntFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) - decrement;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleLpush(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for LPUSH command');

  const key = args[0];
  const values = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isListDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let list: IList<string>;

  if (currentValue === undefined) list = new LinkedList();
  else list = currentValue;

  for (const value of values) list.unshift(value);

  store.set(key, list);

  return list.length();
}

function handleRpush(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for RPUSH command');

  const key = args[0];
  const values = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isListDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let list: IList<string>;

  if (currentValue === undefined) list = new LinkedList();
  else list = currentValue;

  for (const value of values) list.push(value);

  store.set(key, list);

  return list.length();
}

function handleLrange(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 3)
    throw new RespError('wrong number of arguments for LRANGE command');

  const key = args[0];
  const startStr = args[1];
  const stopStr = args[2];

  const start = getIntFromString(startStr);
  const stop = getIntFromString(stopStr);

  if (start === undefined)
    throw new RespError('value is not an integer or out of range');
  if (stop === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue === undefined) return [];
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue as IList<string>;

  return list.slice(start, stop);
}

function handleLlen(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for LLEN command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue === undefined) return 0;
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  return currentValue.length();
}

function handleLpop(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for LPOP command');

  const key = args[0];
  const countStr = args[1];

  const currentValue = store.get(key);

  if (currentValue === undefined) return null;
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue;

  if (countStr === undefined) {
    const result = list.shift() ?? null;

    if (list.length() === 0) store.delete(key);

    return result;
  }

  const count = getIntFromString(countStr);

  if (count === undefined || count < 0)
    throw new RespError('value is not an integer or out of range');

  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const value = list.shift();

    if (value === undefined) break;

    result.push(value);
  }

  if (list.length() === 0) store.delete(key);

  return result;
}

function handleRpop(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for RPOP command');

  const key = args[0];
  const countStr = args[1];

  const currentValue = store.get(key);

  if (currentValue === undefined) return null;
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue;

  if (countStr === undefined) {
    const result = list.pop() ?? null;

    if (list.length() === 0) store.delete(key);

    return result;
  }

  const count = getIntFromString(countStr);

  if (count === undefined || count < 0)
    throw new RespError('value is not an integer or out of range');

  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const value = list.pop();

    if (value === undefined) break;

    result.push(value);
  }

  if (list.length() === 0) store.delete(key);

  return result;
}

function handleLindex(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for LINDEX command');

  const key = args[0];
  const indexStr = args[1];

  const index = getIntFromString(indexStr);

  if (index === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue === undefined) return null;
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue;
  const length = list.length();

  // Handle negative indices
  let normalizedIndex = index;

  if (index < 0) normalizedIndex = length + index;
  if (normalizedIndex < 0 || normalizedIndex >= length) return null;

  const value = list.at(normalizedIndex);

  return value ?? null;
}

function handleLset(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 3)
    throw new RespError('wrong number of arguments for LSET command');

  const key = args[0];
  const indexStr = args[1];
  const newValue = args[2];

  const index = getIntFromString(indexStr);

  if (index === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue === undefined) throw new RespError('no such key');
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue;
  const length = list.length();

  // Handle negative indices
  let normalizedIndex = index;

  if (index < 0) normalizedIndex = length + index;
  if (normalizedIndex < 0 || normalizedIndex >= length)
    throw new RespError('index out of range');

  list.set(normalizedIndex, newValue);

  return 'OK';
}

function handleLtrim(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 3)
    throw new RespError('wrong number of arguments for LTRIM command');

  const key = args[0];
  const startStr = args[1];
  const stopStr = args[2];

  const start = getIntFromString(startStr);
  const stop = getIntFromString(stopStr);

  if (start === undefined)
    throw new RespError('value is not an integer or out of range');
  if (stop === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue === undefined) return 'OK';
  if (!isListDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const list = currentValue;
  const size = list.length();

  let normalizedStart =
    start < 0 ? Math.max(0, size + start) : Math.min(start, size);
  let normalizedEnd =
    stop < 0 ? Math.max(-1, size + stop) : Math.min(stop, size - 1);

  list.trim(normalizedStart, normalizedEnd);

  if (list.length() === 0) store.delete(key);

  return 'OK';
}

function handleSadd(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SADD command');

  const key = args[0];
  const members = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isSetDataType(currentValue))
    throw new RespError(WRONGTYPE_ERROR);

  let set: Set<string>;

  if (currentValue === undefined) set = new Set();
  else set = currentValue;

  let addedCount = 0;

  for (const member of members) {
    if (!set.has(member)) {
      set.add(member);
      addedCount++;
    }
  }

  store.set(key, set);

  return addedCount;
}

function handleSmembers(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for SMEMBERS command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue === undefined) return [];
  if (!isSetDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  return Array.from(currentValue);
}

function handleScard(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for SCARD command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue === undefined) return 0;
  if (!isSetDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  return currentValue.size;
}

function handleSrem(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SREM command');

  const key = args[0];
  const members = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue === undefined) return 0;
  if (!isSetDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  const set = currentValue;
  let removedCount = 0;

  for (const member of members) {
    if (set.has(member)) {
      set.delete(member);
      removedCount++;
    }
  }

  if (set.size === 0) store.delete(key);

  return removedCount;
}

function handleSismember(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for SISMEMBER command');

  const key = args[0];
  const member = args[1];

  const currentValue = store.get(key);

  if (currentValue === undefined) return 0;
  if (!isSetDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  return currentValue.has(member) ? 1 : 0;
}

function handleSmismember(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SMISMEMBER command');

  const key = args[0];
  const members = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue === undefined) return members.map(() => 0);
  if (!isSetDataType(currentValue)) throw new RespError(WRONGTYPE_ERROR);

  return members.map((member) => (currentValue.has(member) ? 1 : 0));
}

function handleSunion(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for SUNION command');

  const keys = args;
  const unionSet = new Set<string>();

  for (const key of keys) {
    const value = store.get(key);

    // Skip non-existent keys (treated as empty sets)
    if (value === undefined) continue;
    if (!isSetDataType(value)) throw new RespError(WRONGTYPE_ERROR);

    for (const member of value) {
      unionSet.add(member);
    }
  }

  return Array.from(unionSet);
}

function handleSinter(
  store: IStore<string, TDataType>,
  args: string[]
): TRespType {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for SINTER command');

  const keys = args;
  let intersectionSet: Set<string> | null = null;

  for (const key of keys) {
    const value = store.get(key);

    // If any key is non-existent (empty set), result is empty
    if (value === undefined) return [];
    if (!isSetDataType(value)) throw new RespError(WRONGTYPE_ERROR);

    if (intersectionSet === null)
      // Initialize with first set
      intersectionSet = new Set(value);
    else {
      // Keep only members that are in both sets
      const nextSet = new Set<string>();

      for (const member of intersectionSet) {
        if (value.has(member)) nextSet.add(member);
      }

      intersectionSet = nextSet;
    }
  }

  return Array.from(intersectionSet || new Set());
}

function handleSdiff(
  store: IStore<string, TDataType>,
  args: string[]
): TRespType {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for SDIFF command');

  const keys = args;
  const firstKey = keys[0];
  const firstValue = store.get(firstKey);

  if (firstValue === undefined) return [];
  if (!isSetDataType(firstValue)) throw new RespError(WRONGTYPE_ERROR);

  // Start with first set (or empty set if non-existent)
  const diffSet = new Set<string>();

  for (const member of firstValue) {
    diffSet.add(member);
  }

  // Remove members found in any of the subsequent sets
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i];
    const value = store.get(key);

    // Skip non-existent keys (treated as empty sets)
    if (value === undefined) continue;
    if (!isSetDataType(value)) throw new RespError(WRONGTYPE_ERROR);

    // Remove members from diffSet that are in this set
    for (const member of value) {
      diffSet.delete(member);
    }
  }

  return Array.from(diffSet);
}

function handleExpire(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for EXPIRE command');

  const key = args[0];
  const seconds = getIntFromString(args[1]);

  if (seconds === undefined)
    throw new RespError('value is not an integer or out of range');
  if (!store.has(key)) return 0;

  const expirationTimeMs = Date.now() + seconds * 1000;

  store.setExpiration(key, expirationTimeMs);

  return 1;
}

function handlePexpire(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for PEXPIRE command');

  const key = args[0];
  const milliseconds = getIntFromString(args[1]);

  if (milliseconds === undefined)
    throw new RespError('value is not an integer or out of range');
  if (!store.has(key)) return 0;

  const expirationTimeMs = Date.now() + milliseconds;

  store.setExpiration(key, expirationTimeMs);

  return 1;
}

function handleExpireat(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for EXPIREAT command');

  const key = args[0];
  const timestamp = getIntFromString(args[1]);

  if (timestamp === undefined)
    throw new RespError('value is not an integer or out of range');
  if (!store.has(key)) return 0;

  const expirationTimeMs = timestamp * 1000;

  store.setExpiration(key, expirationTimeMs);

  return 1;
}

function handlePexpireat(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 2)
    throw new RespError('wrong number of arguments for PEXPIREAT command');

  const key = args[0];
  const timestampMs = getIntFromString(args[1]);

  if (timestampMs === undefined)
    throw new RespError('value is not an integer or out of range');
  if (!store.has(key)) return 0;

  store.setExpiration(key, timestampMs);

  return 1;
}

function handleTtl(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for TTL command');

  const key = args[0];

  if (!store.has(key)) return -2;

  const expirationTimeMs = store.getExpiration(key);

  if (expirationTimeMs === null) return -1;

  const remainingMs = expirationTimeMs - Date.now();
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return Math.max(-2, remainingSeconds);
}

function handlePttl(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for PTTL command');

  const key = args[0];

  if (!store.has(key)) return -2;

  const expirationTimeMs = store.getExpiration(key);

  if (expirationTimeMs === null) return -1;

  const remainingMs = expirationTimeMs - Date.now();

  return Math.max(-2, remainingMs);
}

function handlePersist(store: IStore<string, TDataType>, args: string[]) {
  if (args.length !== 1)
    throw new RespError('wrong number of arguments for PERSIST command');

  const key = args[0];

  if (!store.has(key)) return 0;

  const removed = store.removeExpiration(key);

  return removed ? 1 : 0;
}

type CommandHandler = (
  store: IStore<string, TDataType>,
  args: string[]
) => TRespType;

const commands: Record<string, CommandHandler> = {
  SET: handleSet,
  MSET: handleMset,
  GET: handleGet,
  MGET: handleMget,
  STRLEN: handleStrlen,
  GETRANGE: handleGetRange,
  SETRANGE: handleSetRange,
  GETDEL: handleGetDel,
  APPEND: handleAppend,
  DEL: handleDel,
  EXISTS: handleExists,
  KEYS: handleKeys,
  TYPE: handleType,
  FLUSHALL: handleFlushall,
  PING: handlePing,
  ECHO: handleEcho,
  RENAME: handleRename,
  INCR: handleIncr,
  INCRBY: handleIncrby,
  DECR: handleDecr,
  DECRBY: handleDecrby,
  LPUSH: handleLpush,
  RPUSH: handleRpush,
  LRANGE: handleLrange,
  LLEN: handleLlen,
  LPOP: handleLpop,
  RPOP: handleRpop,
  LINDEX: handleLindex,
  LSET: handleLset,
  LTRIM: handleLtrim,
  SADD: handleSadd,
  SMEMBERS: handleSmembers,
  SCARD: handleScard,
  SREM: handleSrem,
  SISMEMBER: handleSismember,
  SMISMEMBER: handleSmismember,
  SUNION: handleSunion,
  SINTER: handleSinter,
  SDIFF: handleSdiff,
  EXPIRE: handleExpire,
  PEXPIRE: handlePexpire,
  EXPIREAT: handleExpireat,
  PEXPIREAT: handlePexpireat,
  TTL: handleTtl,
  PTTL: handlePttl,
  PERSIST: handlePersist,
};

export function getResponseFromOperation(
  store: IStore<string, TDataType>,
  operation: string,
  args: string[]
) {
  const handler = commands[operation];

  if (!handler) {
    return `Unknown command: ${operation}`;
  }

  return handler(store, args);
}
