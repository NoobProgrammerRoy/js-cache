import { IStore, IStoreValue, TDataType } from './types.js';

class MapStore implements IStore<string, TDataType> {
  private map: Map<string, IStoreValue>;

  constructor() {
    this.map = new Map<string, IStoreValue>();
  }

  private isExpired(key: string) {
    const value = this.map.get(key);

    if (value === undefined) return false;
    if (value.expiration === null) return false;

    const isExpired = Date.now() >= value.expiration;

    if (isExpired) this.map.delete(key);

    return isExpired;
  }

  get(key: string) {
    if (this.isExpired(key)) return undefined;

    const value = this.map.get(key);

    return value?.data;
  }

  set(key: string, value: TDataType) {
    this.map.set(key, { data: value, expiration: null });
  }

  delete(key: string) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  has(key: string) {
    if (this.isExpired(key)) return false;

    return this.map.has(key);
  }

  keys() {
    const keys = Array.from(this.map.keys());

    return keys.filter((key) => !this.isExpired(key));
  }

  setExpiration(key: string, expirationTimeMs: number) {
    const value = this.map.get(key);

    if (value !== undefined) value.expiration = expirationTimeMs;
  }

  getExpiration(key: string) {
    if (this.isExpired(key)) return null;

    const value = this.map.get(key);

    return value?.expiration ?? null;
  }

  removeExpiration(key: string) {
    const value = this.map.get(key);

    if (value !== undefined && value.expiration !== null) {
      value.expiration = null;
      return true;
    }

    return false;
  }
}

export default MapStore;
