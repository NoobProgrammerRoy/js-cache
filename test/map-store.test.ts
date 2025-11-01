import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import MapStore from '../src/map-store.js';

describe('MapStore', () => {
  it('should set and get a value', () => {
    const store = new MapStore();
    store.set('key', 'value');
    assert.strictEqual(store.get('key'), 'value');
  });

  it('should return undefined for non-existent key', () => {
    const store = new MapStore();
    assert.strictEqual(store.get('nonexistent'), undefined);
  });

  it('should check if key exists', () => {
    const store = new MapStore();
    store.set('key', 'value');
    assert.strictEqual(store.has('key'), true);
    assert.strictEqual(store.has('nonexistent'), false);
  });

  it('should delete a key', () => {
    const store = new MapStore();
    store.set('key', 'value');
    const deleted = store.delete('key');
    assert.strictEqual(deleted, true);
    assert.strictEqual(store.get('key'), undefined);
  });

  it('should return false when deleting non-existent key', () => {
    const store = new MapStore();
    const deleted = store.delete('nonexistent');
    assert.strictEqual(deleted, false);
  });

  it('should clear all keys', () => {
    const store = new MapStore();
    store.set('key1', 'value1');
    store.set('key2', 'value2');
    store.clear();
    assert.strictEqual(store.has('key1'), false);
    assert.strictEqual(store.has('key2'), false);
  });

  it('should support multiple data types', () => {
    const store = new MapStore();
    store.set('str', 'value');
    store.set('num', 42);
    assert.strictEqual(store.get('str'), 'value');
    assert.strictEqual(store.get('num'), 42);
  });
});
