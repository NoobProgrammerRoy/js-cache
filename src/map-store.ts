import { IStore, TDataType } from './types.js';

class MapStore implements IStore<string, TDataType> {
  private map;

  constructor() {
    this.map = new Map<string, TDataType>();
  }

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: TDataType) {
    this.map.set(key, value);
  }

  delete(key: string) {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  has(key: string): boolean {
    return this.map.has(key);
  }
}

export default MapStore;
