export type TStringDataType = string | number;

export type TListDataType = IList<TStringDataType>;

export type TDataType = TStringDataType | TListDataType;

export type TRespType = TStringDataType | boolean | null | TRespType[];

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

export interface IList<T> {
  lPush: (value: T) => number;
  rPush: (value: T) => number;
  lPop: () => T | undefined;
  rPop: () => T | undefined;
  lRange: (start: number, end: number) => T[];
  length: () => number;
}

export interface INode<T> {
  value: T;
  next: INode<T> | null;
  prev: INode<T> | null;
}
