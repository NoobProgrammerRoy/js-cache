import { IStore } from './types.js';

class MapStore<K, V> implements IStore<K, V> {
  private map;

  constructor() {
    this.map = new Map<K, V>();
  }

  get(key: K) {
    return this.map.get(key);
  }

  set(key: K, value: V) {
    this.map.set(key, value);
  }

  delete(key: K) {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  has(key: K): boolean {
    return this.map.has(key);
  }
}

export default MapStore;
