import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LLEN command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return 0 for non-existent key', () => {
    const result = executeCommand('LLEN', ['nonexistent']);
    assert.strictEqual(result, 0);
  });

  it('should return 1 for single element list', () => {
    executeCommand('LPUSH', ['mylist', 'world']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 1);
  });

  it('should return correct length after multiple LPUSH', () => {
    executeCommand('LPUSH', ['mylist', 'world']);
    executeCommand('LPUSH', ['mylist', 'hello']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 2);
  });

  it('should return correct length after LPUSH with multiple elements', () => {
    executeCommand('LPUSH', ['mylist', 'a', 'b', 'c']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 3);
  });

  it('should return correct length after multiple RPUSH', () => {
    executeCommand('RPUSH', ['mylist', 'a']);
    executeCommand('RPUSH', ['mylist', 'b']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 2);
  });

  it('should return correct length after RPUSH with multiple elements', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 3);
  });

  it('should return correct length after combined LPUSH and RPUSH', () => {
    executeCommand('LPUSH', ['mylist', 'a']);
    executeCommand('RPUSH', ['mylist', 'b']);
    executeCommand('LPUSH', ['mylist', 'c']);
    executeCommand('RPUSH', ['mylist', 'd']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 4);
  });

  it('should throw error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('LLEN', ['mykey']), RespError);
  });

  it('should throw error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('LLEN', ['mykey']), RespError);
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('LLEN', []), RespError);
  });

  it('should return correct length after LRANGE (which does not modify list)', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    executeCommand('LRANGE', ['mylist', '0', '-1']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 3);
  });

  it('should return consistent length across multiple calls', () => {
    executeCommand('LPUSH', ['mylist', 'a', 'b', 'c']);
    const result1 = executeCommand('LLEN', ['mylist']);
    const result2 = executeCommand('LLEN', ['mylist']);
    const result3 = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result1, 3);
    assert.strictEqual(result2, 3);
    assert.strictEqual(result3, 3);
  });

  it('should maintain correct length with multiple keys in store', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('LPUSH', ['mylist', 'a', 'b', 'c']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 3);
  });

  it('should return 0 after FLUSHALL even if list existed', () => {
    executeCommand('LPUSH', ['mylist', 'a']);
    executeCommand('FLUSHALL', []);
    const result = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(result, 0);
  });
});
