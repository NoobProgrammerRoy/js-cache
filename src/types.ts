import { RespError } from './error.js';

export interface IStore<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  delete: (key: K) => boolean;
  clear: () => void;
  has: (key: K) => boolean;
}

export interface IAOF {
  append: (operation: string, ...args: string[]) => Promise<void>;
  load: () => Promise<string[][]>;
}

export type TRespType =
  | string
  | number
  | boolean
  | null
  | RespError
  | TRespType[];
