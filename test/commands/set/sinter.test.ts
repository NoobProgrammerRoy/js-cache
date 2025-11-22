import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SINTER command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return intersection of two sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'b', 'c', 'd']);
    const result = executeCommand('SINTER', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(!result.includes('a'));
    assert.ok(!result.includes('d'));
  });

  it('should return intersection of multiple sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c', 'd']);
    executeCommand('SADD', ['key2', 'c']);
    executeCommand('SADD', ['key3', 'a', 'c', 'e']);
    const result = executeCommand('SINTER', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result, ['c']);
  });

  it('should return single set when only one key provided', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    const result = executeCommand('SINTER', ['key1']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });

  it('should return empty array when one key is non-existent', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    const result = executeCommand('SINTER', [
      'key1',
      'nonexistent',
    ]) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should return empty array when all keys are non-existent', () => {
    const result = executeCommand('SINTER', [
      'nonexistent1',
      'nonexistent2',
    ]) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should return empty array when sets have no common members', () => {
    executeCommand('SADD', ['key1', 'a', 'b']);
    executeCommand('SADD', ['key2', 'c', 'd']);
    const result = executeCommand('SINTER', ['key1', 'key2']) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should return all members when sets are identical', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'a', 'b', 'c']);
    const result = executeCommand('SINTER', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });

  it('should handle multiple overlapping sets correctly', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c', 'd', 'e']);
    executeCommand('SADD', ['key2', 'b', 'c', 'd', 'f']);
    executeCommand('SADD', ['key3', 'c', 'd', 'g']);
    const result = executeCommand('SINTER', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.deepStrictEqual(result, ['c', 'd']);
  });

  it('should throw WRONGTYPE error when key holds string value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('SET', ['key2', 'notaset']);
    assert.throws(() => executeCommand('SINTER', ['key1', 'key2']), RespError);
  });

  it('should throw WRONGTYPE error when key holds list value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('LPUSH', ['key2', 'item']);
    assert.throws(() => executeCommand('SINTER', ['key1', 'key2']), RespError);
  });

  it('should throw error when no keys provided', () => {
    assert.throws(() => executeCommand('SINTER', []), RespError);
  });

  it('should work correctly after SREM operations', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'b', 'c', 'd']);
    executeCommand('SREM', ['key1', 'b']);
    const result = executeCommand('SINTER', ['key1', 'key2']) as string[];
    assert.deepStrictEqual(result, ['c']);
  });

  it('should work correctly after RENAME command', () => {
    executeCommand('SADD', ['oldkey', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'b', 'c', 'd']);
    executeCommand('RENAME', ['oldkey', 'newkey']);
    const result = executeCommand('SINTER', ['newkey', 'key2']) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });
});
