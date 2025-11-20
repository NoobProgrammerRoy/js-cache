export type TDataType = string | number | IList<string>;

export type TRespType = string | number | boolean | null | TRespType[];

export type TWriteOperation =
  | 'SET'
  | 'MSET'
  | 'DEL'
  | 'INCR'
  | 'INCRBY'
  | 'DECR'
  | 'DECRBY'
  | 'APPEND'
  | 'SETRANGE'
  | 'RENAME'
  | 'LPUSH'
  | 'RPUSH'
  | 'FLUSHALL';

export interface IStore<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  delete: (key: K) => boolean;
  clear: () => void;
  has: (key: K) => boolean;
}

export interface IAOF {
  append: (operation: TWriteOperation, ...args: string[]) => Promise<void>;
  load: () => Promise<TRespType[][]>;
}

export interface IAOFConfig {
  filename: string;
  isEnabled: boolean;
}

export interface INode<T> {
  value: T;
  next: INode<T> | null;
  prev: INode<T> | null;
}

export interface IList<T> {
  unshift: (value: T) => number;
  push: (value: T) => number;
  shift: () => T | undefined;
  pop: () => T | undefined;
  at: (index: number) => T | undefined;
  slice: (start: number, end: number) => T[];
  length: () => number;
  clear: () => void;
}
