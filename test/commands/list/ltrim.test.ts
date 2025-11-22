import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LTRIM command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should trim list to specified range with positive indices', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LTRIM', ['mylist', '1', '3']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['two', 'three', 'four']);
  });

  it('should trim list from start to end', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LTRIM', ['mylist', '0', '2']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two', 'three']);
  });

  it('should trim list using negative indices', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LTRIM', ['mylist', '1', '-1']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['two', 'three', 'four', 'five']);
  });

  it('should trim list with negative start and positive stop', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LTRIM', ['mylist', '-3', '-1']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['three', 'four', 'five']);
  });

  it('should keep only first element when start is 0 and stop is 0', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '0', '0']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one']);
  });

  it('should keep only last element when using negative indices -1 -1', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '-1', '-1']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['three']);
  });

  it('should result in empty list when start is larger than end', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '2', '1']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, []);
  });

  it('should delete key when LTRIM results in empty list', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('LTRIM', ['mylist', '2', '1']);
    const exists = executeCommand('EXISTS', ['mylist']);
    assert.strictEqual(exists, 0);
  });

  it('should handle start larger than list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '10', '20']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, []);
  });

  it('should handle end larger than list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '1', '100']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['two', 'three']);
  });

  it('should handle negative start and stop both larger than list length', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '-100', '-20']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, []);
  });

  it('should work with non-existent key (no-op)', () => {
    const result = executeCommand('LTRIM', ['nonexistent', '0', '-1']);
    assert.strictEqual(result, 'OK');
    const exists = executeCommand('EXISTS', ['nonexistent']);
    assert.strictEqual(exists, 0);
  });

  it('should throw error for string value', () => {
    executeCommand('SET', ['stringkey', 'stringvalue']);
    assert.throws(
      () => executeCommand('LTRIM', ['stringkey', '0', '2']),
      RespError
    );
  });

  it('should throw error for number value', () => {
    executeCommand('SET', ['numberkey', '42']);
    assert.throws(
      () => executeCommand('LTRIM', ['numberkey', '0', '2']),
      RespError
    );
  });

  it('should throw error for missing arguments', () => {
    assert.throws(() => executeCommand('LTRIM', ['key']), RespError);
  });

  it('should throw error for missing stop argument', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('LTRIM', ['mylist', '0']), RespError);
  });

  it('should throw error when start is not an integer', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LTRIM', ['mylist', 'notanumber', '2']),
      RespError
    );
  });

  it('should throw error when stop is not an integer', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LTRIM', ['mylist', '0', 'notanumber']),
      RespError
    );
  });

  it('should preserve list length update after LTRIM', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    executeCommand('LTRIM', ['mylist', '1', '3']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 3);
  });

  it('should work after LPUSH and RPUSH operations', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    executeCommand('LPUSH', ['mylist', 'x', 'y']);
    // List is now: y, x, a, b, c
    const result = executeCommand('LTRIM', ['mylist', '1', '3']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['x', 'a', 'b']);
  });

  it('should trim and then allow new LPUSH/RPUSH operations', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    executeCommand('LTRIM', ['mylist', '1', '3']);
    executeCommand('LPUSH', ['mylist', 'zero']);
    executeCommand('RPUSH', ['mylist', 'six']);
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['zero', 'two', 'three', 'four', 'six']);
  });

  it('should work with multiple keys in store', () => {
    executeCommand('RPUSH', ['list1', 'a', 'b', 'c', 'd']);
    executeCommand('RPUSH', ['list2', 'x', 'y', 'z', 'w']);
    executeCommand('LTRIM', ['list1', '0', '1']);
    executeCommand('LTRIM', ['list2', '1', '2']);
    const remaining1 = executeCommand('LRANGE', ['list1', '0', '-1']);
    const remaining2 = executeCommand('LRANGE', ['list2', '0', '-1']);
    assert.deepStrictEqual(remaining1, ['a', 'b']);
    assert.deepStrictEqual(remaining2, ['y', 'z']);
  });

  it('should trim to entire list (no-op)', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LTRIM', ['mylist', '0', '-1']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['one', 'two', 'three']);
  });

  it('should handle both negative indices pointing to same element', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three', 'four', 'five']);
    const result = executeCommand('LTRIM', ['mylist', '-2', '-2']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['four']);
  });

  it('should handle LTRIM 0 99 common use case', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    const result = executeCommand('LTRIM', ['mylist', '0', '99']);
    assert.strictEqual(result, 'OK');
    const remaining = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(remaining, ['a', 'b', 'c']);
  });
});
