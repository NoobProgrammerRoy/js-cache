export type TDataType = string | number;

export type TRespType = TDataType | boolean | null | TRespType[];

export type TWriteOperation =
  | 'SET'
  | 'DEL'
  | 'INCR'
  | 'INCRBY'
  | 'DECR'
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
