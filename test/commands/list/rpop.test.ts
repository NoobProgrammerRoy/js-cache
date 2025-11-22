import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('RPOP command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return nil for non-existent key', () => {
    const result = executeCommand('RPOP', ['nonexistent']);
    assert.strictEqual(result, null);
  });

  it('should pop single element from tail of list without count', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result, 'three');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two']);
  });

  it('should pop single element and return null when list is empty', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    executeCommand('RPOP', ['mylist']);
    const result = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result, null);
  });

  it('should pop specified count of elements from tail', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('RPOP', ['mylist', '2']);
    assert.deepStrictEqual(result, ['five', 'four']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two', 'three']);
  });

  it('should pop all elements when count equals list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('RPOP', ['mylist', '3']);
    assert.deepStrictEqual(result, ['three', 'two', 'one']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 0);
  });

  it('should pop only available elements when count exceeds list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('RPOP', ['mylist', '10']);
    assert.deepStrictEqual(result, ['three', 'two', 'one']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 0);
  });

  it('should return empty array when count is greater than list length', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    const result = executeCommand('RPOP', ['mylist', '5']);
    assert.deepStrictEqual(result, ['one']);
  });

  it('should pop with count 0 returning empty array', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two']);
    const result = executeCommand('RPOP', ['mylist', '0']);
    assert.deepStrictEqual(result, []);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two']);
  });

  it('should throw error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('RPOP', ['mykey']), RespError);
  });

  it('should throw error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('RPOP', ['mykey']), RespError);
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('RPOP', []), RespError);
  });

  it('should throw error when count is not an integer', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('RPOP', ['mylist', 'abc']), RespError);
  });

  it('should throw error when count is negative', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('RPOP', ['mylist', '-1']), RespError);
  });

  it('should pop multiple times from same list', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e']);
    const result1 = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result1, 'e');
    const result2 = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result2, 'd');
    const result3 = executeCommand('RPOP', ['mylist', '2']);
    assert.deepStrictEqual(result3, ['c', 'b']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['a']);
  });

  it('should work with lists created by LPUSH', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result, 'three');
  });

  it('should maintain list integrity after pop with count', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e']);
    executeCommand('RPOP', ['mylist', '2']);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['a', 'b', 'c']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 3);
  });

  it('should work with very long string values', () => {
    const longString = 'x'.repeat(10000);
    executeCommand('RPUSH', ['mylist', 'short', longString]);
    const result = executeCommand('RPOP', ['mylist']);
    assert.strictEqual(result, longString);
  });

  it('should handle multiple keys in store', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('RPOP', ['mylist', '2']);
    assert.deepStrictEqual(result, ['c', 'b']);
    assert.strictEqual(executeCommand('GET', ['key1']), 'value1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value2');
  });

  it('should return elements in reverse order when popping with count', () => {
    executeCommand('RPUSH', ['mylist', '1', '2', '3', '4', '5']);
    const result = executeCommand('RPOP', ['mylist', '5']);
    assert.deepStrictEqual(result, ['5', '4', '3', '2', '1']);
  });

  it('should work correctly with combined LPOP and RPOP operations', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e', 'f']);
    const lpopResult = executeCommand('LPOP', ['mylist', '2']);
    assert.deepStrictEqual(lpopResult, ['a', 'b']);
    const rpopResult = executeCommand('RPOP', ['mylist', '2']);
    assert.deepStrictEqual(rpopResult, ['f', 'e']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['c', 'd']);
  });

  it('should delete key when single RPOP empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    executeCommand('RPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when multiple RPOP operations empty the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('RPOP', ['mylist']);
    executeCommand('RPOP', ['mylist']);
    executeCommand('RPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when RPOP with count empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('RPOP', ['mylist', '3']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should delete key when RPOP with count greater than list length empties the list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two']);
    executeCommand('RPOP', ['mylist', '10']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should not delete key when RPOP leaves elements in list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('RPOP', ['mylist']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 1);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two']);
  });

  it('should not delete key when RPOP with count leaves elements in list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four']);
    executeCommand('RPOP', ['mylist', '2']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 1);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two']);
  });

  it('should delete key when combined LPOP and RPOP operations empty the list', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd']);
    executeCommand('LPOP', ['mylist', '2']);
    executeCommand('RPOP', ['mylist', '2']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });
});
