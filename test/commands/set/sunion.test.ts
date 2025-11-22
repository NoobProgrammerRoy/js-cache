import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SUNION command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return union of two sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'c', 'd', 'e']);
    const result = executeCommand('SUNION', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 5);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
    assert.ok(result.includes('e'));
  });

  it('should return union of multiple sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b']);
    executeCommand('SADD', ['key2', 'b', 'c']);
    executeCommand('SADD', ['key3', 'c', 'd']);
    const result = executeCommand('SUNION', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.strictEqual(result.length, 4);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
  });

  it('should return single set when only one key provided', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    const result = executeCommand('SUNION', ['key1']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });

  it('should handle non-existent keys as empty sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b']);
    const result = executeCommand('SUNION', [
      'key1',
      'nonexistent',
      'key2',
    ]) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
  });

  it('should return empty array when all keys are non-existent', () => {
    const result = executeCommand('SUNION', [
      'nonexistent1',
      'nonexistent2',
    ]) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should eliminate duplicates in union', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'b', 'c', 'd']);
    executeCommand('SADD', ['key3', 'c', 'd', 'e']);
    const result = executeCommand('SUNION', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.strictEqual(result.length, 5);
    const uniqueCount = new Set(result).size;
    assert.strictEqual(uniqueCount, 5);
  });

  it('should be case-sensitive for members', () => {
    executeCommand('SADD', ['key1', 'Hello']);
    executeCommand('SADD', ['key2', 'hello', 'HELLO']);
    const result = executeCommand('SUNION', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('Hello'));
    assert.ok(result.includes('hello'));
    assert.ok(result.includes('HELLO'));
  });

  it('should throw WRONGTYPE error when key holds string value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('SET', ['key2', 'notaset']);
    assert.throws(() => executeCommand('SUNION', ['key1', 'key2']), RespError);
  });

  it('should throw WRONGTYPE error when key holds list value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('LPUSH', ['key2', 'item']);
    assert.throws(() => executeCommand('SUNION', ['key1', 'key2']), RespError);
  });

  it('should throw error when no keys provided', () => {
    assert.throws(() => executeCommand('SUNION', []), RespError);
  });

  it('should work correctly after SREM operations', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'c', 'd', 'e']);
    executeCommand('SREM', ['key1', 'a']);
    const result = executeCommand('SUNION', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 4);
    assert.ok(!result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
    assert.ok(result.includes('e'));
  });

  it('should work correctly after RENAME command', () => {
    executeCommand('SADD', ['oldkey', 'a', 'b']);
    executeCommand('SADD', ['key2', 'c', 'd']);
    executeCommand('RENAME', ['oldkey', 'newkey']);
    const result = executeCommand('SUNION', ['newkey', 'key2']) as string[];
    assert.strictEqual(result.length, 4);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
  });
});
