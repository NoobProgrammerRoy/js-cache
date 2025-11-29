import { IStore, IStoreValue, TDataType } from './types.js';

class MapStore implements IStore<string, TDataType> {
  private map: Map<string, IStoreValue>;

  constructor() {
    this.map = new Map<string, IStoreValue>();
  }

  private isExpired(key: string): boolean {
    const storeValue = this.map.get(key);
    if (storeValue === undefined) {
      return false;
    }

    if (storeValue.expiration === null) {
      return false;
    }

    const isExpired = Date.now() > storeValue.expiration;
    if (isExpired) {
      this.map.delete(key);
    }
    return isExpired;
  }

  get(key: string): TDataType | undefined {
    if (this.isExpired(key)) {
      return undefined;
    }
    const storeValue = this.map.get(key);
    return storeValue?.data;
  }

  set(key: string, value: TDataType): void {
    this.map.set(key, { data: value, expiration: null });
  }

  delete(key: string): boolean {
    if (this.isExpired(key)) {
      return false;
    }
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  has(key: string): boolean {
    if (this.isExpired(key)) {
      return false;
    }
    return this.map.has(key);
  }

  keys(): string[] {
    const allKeys = Array.from(this.map.keys());
    return allKeys.filter((key) => !this.isExpired(key));
  }

  setExpiration(key: string, expirationTimeMs: number): void {
    const storeValue = this.map.get(key);
    if (storeValue !== undefined) {
      storeValue.expiration = expirationTimeMs;
    }
  }

  getExpiration(key: string): number | null {
    if (this.isExpired(key)) {
      return null;
    }
    const storeValue = this.map.get(key);
    return storeValue?.expiration ?? null;
  }

  removeExpiration(key: string): boolean {
    const storeValue = this.map.get(key);
    if (storeValue !== undefined && storeValue.expiration !== null) {
      storeValue.expiration = null;
      return true;
    }
    return false;
  }
}

export default MapStore;
