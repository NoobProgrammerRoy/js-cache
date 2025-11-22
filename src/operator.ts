import { RespError } from './error.js';
import LinkedList from './linked-list.js';
import { IList, IStore, TDataType, TRespType } from './types.js';
import {
  getIntFromString,
  getNumberFromString,
  isListDataType,
  isStringDataType,
  WRONGTYPE_ERROR,
} from './util.js';

function handleSet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SET command');

  const key = args[0];
  const value = args[1];

  if (getNumberFromString(value) !== undefined) {
    store.set(key, Number(value));
  } else {
    store.set(key, value);
  }

  return 'OK';
}

function handleMset(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2 || args.length % 2 !== 0)
    throw new RespError('wrong number of arguments for MSET command');

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (getNumberFromString(value) !== undefined) {
      store.set(key, Number(value));
    } else {
      store.set(key, value);
    }
  }

  return 'OK';
}

function handleGet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for GET command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;

  if (!isStringDataType(value)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  if (typeof value === 'number') return value + '';

  return value;
}

function handleMget(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for MGET command');

  const result: TRespType[] = [];

  for (const key of args) {
    const value = store.get(key);

    if (value === undefined) {
      result.push(null);
    } else if (!isStringDataType(value)) {
      result.push(null);
    } else if (typeof value === 'string') {
      result.push(value);
    } else if (typeof value === 'number') {
      result.push(value.toString());
    }
  }

  return result;
}

function handleStrlen(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for STRLEN command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return 0;

  if (!isStringDataType(value)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  if (typeof value === 'string') {
    return value.length;
  }

  return value.toString().length;
}

function handleGetRange(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 3)
    throw new RespError('wrong number of arguments for GETRANGE command');

  const key = args[0];
  const startStr = args[1];
  const endStr = args[2];

  const start = getNumberFromString(startStr);
  if (start === undefined)
    throw new RespError('value is not an integer or out of range');

  const end = getNumberFromString(endStr);
  if (end === undefined)
    throw new RespError('value is not an integer or out of range');

  const value = store.get(key);

  if (value === undefined) return '';

  if (!isStringDataType(value)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  // Convert value to string (handles both string and number types)
  const str = typeof value === 'number' ? value.toString() : String(value);
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
  if (args.length < 3)
    throw new RespError('wrong number of arguments for SETRANGE command');

  const key = args[0];
  const offsetStr = args[1];
  const valueToSet = args[2];

  const offset = getNumberFromString(offsetStr);
  if (offset === undefined)
    throw new RespError('value is not an integer or out of range');

  if (offset < 0)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  // Convert current value to string (or empty string if non-existent)
  let str = '';
  if (currentValue !== undefined) {
    str =
      typeof currentValue === 'number'
        ? currentValue.toString()
        : String(currentValue);
  }

  // If offset is beyond current length, pad with null bytes
  if (offset > str.length) {
    str = str + '\x00'.repeat(offset - str.length);
  }

  // Overwrite from offset to offset + valueToSet.length
  const before = str.substring(0, offset);
  const after = str.substring(offset + valueToSet.length);
  const newValue = before + valueToSet + after;

  store.set(key, newValue);

  return newValue.length;
}

function handleGetDel(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for GETDEL command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;

  if (!isStringDataType(value)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  store.delete(key);

  if (typeof value === 'string') return value;

  return value.toString();
}

function handleAppend(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for APPEND command');

  const key = args[0];
  const valueToAppend = args[1];
  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let newValue: string;

  if (currentValue === undefined) {
    newValue = valueToAppend;
  } else if (typeof currentValue === 'string') {
    newValue = currentValue.concat(valueToAppend);
  } else {
    newValue = currentValue.toString().concat(valueToAppend);
  }

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

  if (!store.has(oldKey)) {
    throw new RespError('ERR no such key');
  }

  if (oldKey === newKey) {
    return 'OK';
  }

  const value = store.get(oldKey);

  store.set(newKey, value!);
  store.delete(oldKey);

  return 'OK';
}

function handleIncr(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for INCR command');

  const key = args[0];
  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let newValue: number;

  if (currentValue === undefined) newValue = 1;
  else if (
    typeof currentValue === 'number' ||
    getNumberFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) + 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleIncrby(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for INCRBY command');

  const key = args[0];
  const incrementStr = args[1];

  const increment = getNumberFromString(incrementStr);
  if (increment === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let newValue: number;

  if (currentValue === undefined) newValue = increment;
  else if (
    typeof currentValue === 'number' ||
    getNumberFromString(currentValue) !== undefined
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

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let newValue: number;

  if (currentValue === undefined) newValue = -1;
  else if (
    typeof currentValue === 'number' ||
    getNumberFromString(currentValue) !== undefined
  )
    newValue = Number(currentValue) - 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleDecrby(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for DECRBY command');

  const key = args[0];
  const decrementStr = args[1];

  const decrement = getNumberFromString(decrementStr);
  if (decrement === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isStringDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let newValue: number;

  if (currentValue === undefined) newValue = -decrement;
  else if (
    typeof currentValue === 'number' ||
    getNumberFromString(currentValue) !== undefined
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

  if (currentValue !== undefined && !isListDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let list: IList<string>;
  if (currentValue === undefined) {
    list = new LinkedList();
  } else {
    list = currentValue;
  }

  for (const value of values) {
    list.unshift(value);
  }

  store.set(key, list);

  return list.length();
}

function handleRpush(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for RPUSH command');

  const key = args[0];
  const values = args.slice(1);

  const currentValue = store.get(key);

  if (currentValue !== undefined && !isListDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  let list: IList<string>;
  if (currentValue === undefined) {
    list = new LinkedList();
  } else {
    list = currentValue;
  }

  for (const value of values) {
    list.push(value);
  }

  store.set(key, list);

  return list.length();
}

function handleLrange(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 3)
    throw new RespError('wrong number of arguments for LRANGE command');

  const key = args[0];
  const startStr = args[1];
  const stopStr = args[2];

  const start = getIntFromString(startStr);
  if (start === undefined)
    throw new RespError('value is not an integer or out of range');

  const stop = getIntFromString(stopStr);
  if (stop === undefined)
    throw new RespError('value is not an integer or out of range');

  const currentValue = store.get(key);

  // Key doesn't exist - return empty array
  if (currentValue === undefined) {
    return [];
  }

  // Key is not a list - throw WRONGTYPE error
  if (!isListDataType(currentValue)) {
    throw new RespError(WRONGTYPE_ERROR);
  }

  const list = currentValue as IList<string>;
  return list.slice(start, stop);
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
