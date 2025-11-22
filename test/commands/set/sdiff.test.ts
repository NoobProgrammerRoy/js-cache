import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SDIFF command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return difference between two sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    executeCommand('SADD', ['key2', 'c', 'd', 'e']);
    const result = executeCommand('SDIFF', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(!result.includes('c'));
  });

  it('should return difference between first set and multiple sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c', 'd']);
    executeCommand('SADD', ['key2', 'c']);
    executeCommand('SADD', ['key3', 'a', 'c', 'e']);
    const result = executeCommand('SDIFF', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.deepStrictEqual(result.sort(), ['b', 'd']);
  });

  it('should return full set when only one key provided', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    const result = executeCommand('SDIFF', ['key1']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });

  it('should return full first set when other keys are non-existent', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c']);
    const result = executeCommand('SDIFF', [
      'key1',
      'nonexistent1',
      'nonexistent2',
    ]) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });

  it('should return empty array when first key is non-existent', () => {
    executeCommand('SADD', ['key2', 'a', 'b']);
    const result = executeCommand('SDIFF', ['nonexistent', 'key2']) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should return empty array when first set is subset of second', () => {
    executeCommand('SADD', ['key1', 'a', 'b']);
    executeCommand('SADD', ['key2', 'a', 'b', 'c', 'd']);
    const result = executeCommand('SDIFF', ['key1', 'key2']) as string[];
    assert.deepStrictEqual(result, []);
  });

  it('should return full first set when sets are disjoint', () => {
    executeCommand('SADD', ['key1', 'a', 'b']);
    executeCommand('SADD', ['key2', 'c', 'd']);
    const result = executeCommand('SDIFF', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
  });

  it('should handle difference with multiple removing sets', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c', 'd', 'e']);
    executeCommand('SADD', ['key2', 'b', 'c']);
    executeCommand('SADD', ['key3', 'd']);
    const result = executeCommand('SDIFF', [
      'key1',
      'key2',
      'key3',
    ]) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('e'));
  });

  it('should throw WRONGTYPE error when first key holds string value', () => {
    executeCommand('SET', ['key1', 'notaset']);
    executeCommand('SADD', ['key2', 'a']);
    assert.throws(() => executeCommand('SDIFF', ['key1', 'key2']), RespError);
  });

  it('should throw WRONGTYPE error when other key holds string value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('SET', ['key2', 'notaset']);
    assert.throws(() => executeCommand('SDIFF', ['key1', 'key2']), RespError);
  });

  it('should throw WRONGTYPE error when key holds list value', () => {
    executeCommand('SADD', ['key1', 'a']);
    executeCommand('LPUSH', ['key2', 'item']);
    assert.throws(() => executeCommand('SDIFF', ['key1', 'key2']), RespError);
  });

  it('should throw error when no keys provided', () => {
    assert.throws(() => executeCommand('SDIFF', []), RespError);
  });

  it('should work correctly after SREM operations', () => {
    executeCommand('SADD', ['key1', 'a', 'b', 'c', 'd']);
    executeCommand('SADD', ['key2', 'c']);
    executeCommand('SREM', ['key2', 'c']);
    const result = executeCommand('SDIFF', ['key1', 'key2']) as string[];
    assert.strictEqual(result.length, 4);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
  });

  it('should work correctly after RENAME command', () => {
    executeCommand('SADD', ['oldkey1', 'a', 'b', 'c']);
    executeCommand('SADD', ['oldkey2', 'b', 'c']);
    executeCommand('RENAME', ['oldkey1', 'newkey1']);
    executeCommand('RENAME', ['oldkey2', 'newkey2']);
    const result = executeCommand('SDIFF', ['newkey1', 'newkey2']) as string[];
    assert.deepStrictEqual(result, ['a']);
  });
});
