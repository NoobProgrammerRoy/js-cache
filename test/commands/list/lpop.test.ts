import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LPOP command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return nil for non-existent key', () => {
    const result = executeCommand('LPOP', ['nonexistent']);
    assert.strictEqual(result, null);
  });

  it('should pop single element from list without count', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LPOP', ['mylist']);
    assert.strictEqual(result, 'one');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['two', 'three']);
  });

  it('should pop single element and return null when list is empty', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    executeCommand('LPOP', ['mylist']);
    const result = executeCommand('LPOP', ['mylist']);
    assert.strictEqual(result, null);
  });

  it('should pop specified count of elements', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LPOP', ['mylist', '2']);
    assert.deepStrictEqual(result, ['one', 'two']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['three', 'four', 'five']);
  });

  it('should pop all elements when count equals list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LPOP', ['mylist', '3']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 0);
  });

  it('should pop only available elements when count exceeds list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LPOP', ['mylist', '10']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 0);
  });

  it('should pop with count 0 returning empty array', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two']);
    const result = executeCommand('LPOP', ['mylist', '0']);
    assert.deepStrictEqual(result, []);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two']);
  });

  it('should throw error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('LPOP', ['mykey']), RespError);
  });

  it('should throw error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('LPOP', ['mykey']), RespError);
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('LPOP', []), RespError);
  });

  it('should throw error when count is not an integer', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('LPOP', ['mylist', 'abc']), RespError);
  });

  it('should throw error when count is negative', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('LPOP', ['mylist', '-1']), RespError);
  });

  it('should pop multiple times from same list', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e']);
    const result1 = executeCommand('LPOP', ['mylist']);
    assert.strictEqual(result1, 'a');
    const result2 = executeCommand('LPOP', ['mylist']);
    assert.strictEqual(result2, 'b');
    const result3 = executeCommand('LPOP', ['mylist', '2']);
    assert.deepStrictEqual(result3, ['c', 'd']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['e']);
  });

  it('should return nil after popping all elements', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    executeCommand('LPOP', ['mylist']);
    const result = executeCommand('LPOP', ['mylist']);
    assert.strictEqual(result, null);
  });

  it('should delete key when single LPOP empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    executeCommand('LPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when multiple LPOP operations empty the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('LPOP', ['mylist']);
    executeCommand('LPOP', ['mylist']);
    executeCommand('LPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when LPOP with count empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('LPOP', ['mylist', '3']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when LPOP with count greater than list length empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two']);
    executeCommand('LPOP', ['mylist', '10']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should not delete key when LPOP leaves elements in list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('LPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 1);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['two', 'three']);
  });

  it('should not delete key when LPOP with count leaves elements in list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four']);
    executeCommand('LPOP', ['mylist', '2']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 1);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['three', 'four']);
  });
});
