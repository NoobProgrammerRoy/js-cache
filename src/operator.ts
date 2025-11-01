import { RespError } from './error.js';
import { IStore, TDataType, TRespType } from './types.js';
import { getNumberFromString } from './util.js';

function handleSet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 2)
    throw new RespError('wrong number of arguments for SET command');

  const key = args[0];
  const value = args[1];

  if (getNumberFromString(value) !== undefined) {
    store.set(key, Number(value));

    return 'OK';
  }

  store.set(key, value);

  return 'OK';
}

function handleGet(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for GET command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;
  if (typeof value === 'number') return value + '';

  return value;
}

function handleGetDel(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for GETDEL command');

  const key = args[0];
  const value = store.get(key);

  if (value === undefined) return null;

  if (typeof value === 'string') {
    store.delete(key);

    return value;
  }

  if (typeof value === 'number') {
    store.delete(key);

    return value.toString();
  }

  return null;
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

function handleIncr(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for INCR command');

  const key = args[0];
  const currentValue = store.get(key);
  let newValue: number;

  if (currentValue === undefined) newValue = 1;
  else if (typeof currentValue === 'number')
    newValue = Number(currentValue) + 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

function handleDecr(store: IStore<string, TDataType>, args: string[]) {
  if (args.length < 1)
    throw new RespError('wrong number of arguments for DECR command');

  const key = args[0];
  const currentValue = store.get(key);
  let newValue: number;

  if (currentValue === undefined) newValue = -1;
  else if (typeof currentValue === 'number')
    newValue = Number(currentValue) - 1;
  else throw new RespError('value is not an integer or out of range');

  store.set(key, newValue);

  return newValue;
}

type CommandHandler = (
  store: IStore<string, TDataType>,
  args: string[]
) => TRespType;

const commands: Record<string, CommandHandler> = {
  SET: handleSet,
  GET: handleGet,
  GETDEL: handleGetDel,
  DEL: handleDel,
  EXISTS: handleExists,
  FLUSHALL: handleFlushall,
  PING: handlePing,
  INCR: handleIncr,
  DECR: handleDecr,
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
