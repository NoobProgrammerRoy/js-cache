import { RespError } from './error.js';

export interface IStore<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  delete: (key: K) => boolean;
  clear: () => void;
  has: (key: K) => boolean;
}

export interface IAOF {
  append: (operation: TWriteOperation, ...args: TRespType[]) => Promise<void>;
  load: () => Promise<TRespType[][]>;
}

export interface IAOFConfig {
  filename: string;
  isEnabled: boolean;
}

export type TRespType =
  | string
  | number
  | boolean
  | null
  | RespError
  | TRespType[];

export type TWriteOperation = 'SET' | 'DEL' | 'INCR' | 'DECR' | 'FLUSHALL';
