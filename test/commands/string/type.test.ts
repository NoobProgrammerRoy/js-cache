import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('TYPE command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return "string" for string values', () => {
    executeCommand('SET', ['key1', 'value']);
    const result = executeCommand('TYPE', ['key1']);
    assert.strictEqual(result, 'string');
  });

  it('should return "string" for numeric values stored as strings', () => {
    executeCommand('SET', ['key1', '123']);
    const result = executeCommand('TYPE', ['key1']);
    assert.strictEqual(result, 'string');
  });

  it('should return "string" for numeric values created by INCR', () => {
    executeCommand('INCR', ['counter']);
    const result = executeCommand('TYPE', ['counter']);
    assert.strictEqual(result, 'string');
  });

  it('should return "string" for numeric values created by DECR', () => {
    executeCommand('DECR', ['counter']);
    const result = executeCommand('TYPE', ['counter']);
    assert.strictEqual(result, 'string');
  });

  it('should return "list" for list values', () => {
    executeCommand('LPUSH', ['mylist', 'value']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'list');
  });

  it('should return "list" for RPUSH created lists', () => {
    executeCommand('RPUSH', ['mylist', 'value']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'list');
  });

  it('should return "set" for set values', () => {
    executeCommand('SADD', ['myset', 'member']);
    const result = executeCommand('TYPE', ['myset']);
    assert.strictEqual(result, 'set');
  });

  it('should return "none" for non-existent keys', () => {
    const result = executeCommand('TYPE', ['nonexistent']);
    assert.strictEqual(result, 'none');
  });

  it('should return "none" when key is deleted', () => {
    executeCommand('SET', ['key1', 'value']);
    executeCommand('DEL', ['key1']);
    const result = executeCommand('TYPE', ['key1']);
    assert.strictEqual(result, 'none');
  });

  it('should handle TYPE command after MSET', () => {
    executeCommand('MSET', ['key1', 'value1', 'key2', 'value2']);
    const result1 = executeCommand('TYPE', ['key1']);
    const result2 = executeCommand('TYPE', ['key2']);
    assert.strictEqual(result1, 'string');
    assert.strictEqual(result2, 'string');
  });

  it('should return type after RENAME', () => {
    executeCommand('SET', ['oldkey', 'value']);
    executeCommand('RENAME', ['oldkey', 'newkey']);
    const result = executeCommand('TYPE', ['newkey']);
    const oldResult = executeCommand('TYPE', ['oldkey']);
    assert.strictEqual(result, 'string');
    assert.strictEqual(oldResult, 'none');
  });

  it('should work with INCRBY command', () => {
    executeCommand('INCRBY', ['counter', '5']);
    const result = executeCommand('TYPE', ['counter']);
    assert.strictEqual(result, 'string');
  });

  it('should work with DECRBY command', () => {
    executeCommand('INCRBY', ['counter', '10']);
    executeCommand('DECRBY', ['counter', '3']);
    const result = executeCommand('TYPE', ['counter']);
    assert.strictEqual(result, 'string');
  });

  it('should return "none" when list is empty after LPOP', () => {
    executeCommand('LPUSH', ['mylist', 'a']);
    executeCommand('LPOP', ['mylist']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'none');
  });

  it('should return "none" when list is empty after RPOP', () => {
    executeCommand('LPUSH', ['mylist', 'a']);
    executeCommand('RPOP', ['mylist']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'none');
  });

  it('should return "none" when set is empty after SREM', () => {
    executeCommand('SADD', ['myset', 'member']);
    executeCommand('SREM', ['myset', 'member']);
    const result = executeCommand('TYPE', ['myset']);
    assert.strictEqual(result, 'none');
  });

  it('should differentiate between different key types', () => {
    executeCommand('SET', ['stringkey', 'value']);
    executeCommand('LPUSH', ['listkey', 'value']);
    executeCommand('SADD', ['setkey', 'value']);

    const stringType = executeCommand('TYPE', ['stringkey']);
    const listType = executeCommand('TYPE', ['listkey']);
    const setType = executeCommand('TYPE', ['setkey']);

    assert.strictEqual(stringType, 'string');
    assert.strictEqual(listType, 'list');
    assert.strictEqual(setType, 'set');
  });

  it('should handle GETDEL command', () => {
    executeCommand('SET', ['key1', 'value']);
    executeCommand('GETDEL', ['key1']);
    const result = executeCommand('TYPE', ['key1']);
    assert.strictEqual(result, 'none');
  });

  it('should work with LTRIM command', () => {
    executeCommand('RPUSH', ['mylist', 'a']);
    executeCommand('RPUSH', ['mylist', 'b']);
    executeCommand('RPUSH', ['mylist', 'c']);
    executeCommand('LTRIM', ['mylist', '0', '1']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'list');
  });

  it('should return "none" when list is empty after LTRIM', () => {
    executeCommand('LPUSH', ['mylist', 'a']);
    executeCommand('LTRIM', ['mylist', '10', '20']);
    const result = executeCommand('TYPE', ['mylist']);
    assert.strictEqual(result, 'none');
  });

  it('should throw error when no arguments provided', () => {
    assert.throws(
      () => executeCommand('TYPE', []),
      (err: Error) => err.message.includes('wrong number of arguments')
    );
  });

  it('should throw error when too many arguments provided', () => {
    assert.throws(
      () => executeCommand('TYPE', ['key1', 'key2']),
      (err: Error) => err.message.includes('wrong number of arguments')
    );
  });

  it('should work correctly with FLUSHALL', () => {
    executeCommand('SET', ['key1', 'value']);
    executeCommand('FLUSHALL', []);
    const result = executeCommand('TYPE', ['key1']);
    assert.strictEqual(result, 'none');
  });

  it('should work with empty string values', () => {
    executeCommand('SET', ['emptykey', '']);
    const result = executeCommand('TYPE', ['emptykey']);
    assert.strictEqual(result, 'string');
  });
});
