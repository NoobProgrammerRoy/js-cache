import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LINDEX command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return nil for non-existent key', () => {
    const result = executeCommand('LINDEX', ['nonexistent', '0']);
    assert.strictEqual(result, null);
  });

  it('should return element at positive index 0', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '0']);
    assert.strictEqual(result, 'one');
  });

  it('should return element at positive index 1', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '1']);
    assert.strictEqual(result, 'two');
  });

  it('should return element at positive index 2', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '2']);
    assert.strictEqual(result, 'three');
  });

  it('should return nil for out-of-range positive index', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '3']);
    assert.strictEqual(result, null);
  });

  it('should return element at negative index -1 (last element)', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '-1']);
    assert.strictEqual(result, 'three');
  });

  it('should return element at negative index -2', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '-2']);
    assert.strictEqual(result, 'two');
  });

  it('should return element at negative index -3 (first element)', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '-3']);
    assert.strictEqual(result, 'one');
  });

  it('should return nil for out-of-range negative index', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LINDEX', ['mylist', '-4']);
    assert.strictEqual(result, null);
  });

  it('should throw WRONGTYPE error for string value', () => {
    executeCommand('SET', ['stringkey', 'stringvalue']);
    assert.throws(
      () => executeCommand('LINDEX', ['stringkey', '0']),
      RespError
    );
  });

  it('should throw WRONGTYPE error for number value', () => {
    executeCommand('SET', ['numberkey', '42']);
    assert.throws(
      () => executeCommand('LINDEX', ['numberkey', '0']),
      RespError
    );
  });

  it('should throw error for missing arguments', () => {
    assert.throws(() => executeCommand('LINDEX', ['key']), RespError);
  });

  it('should throw error for non-integer index', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LINDEX', ['mylist', 'notanumber']),
      RespError
    );
  });

  it('should work with single-element list', () => {
    executeCommand('RPUSH', ['mylist', 'single']);
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '0']), 'single');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '-1']), 'single');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '1']), null);
  });

  it('should work with empty list', () => {
    executeCommand('RPUSH', ['emptylist', 'temp']);
    executeCommand('LPOP', ['emptylist']);
    const result = executeCommand('LINDEX', ['emptylist', '0']);
    assert.strictEqual(result, null);
  });

  it('should work with multiple keys in store', () => {
    executeCommand('RPUSH', ['list1', 'list1_elem0', 'list1_elem1']);
    executeCommand('RPUSH', ['list2', 'list2_elem0', 'list2_elem1']);

    assert.strictEqual(executeCommand('LINDEX', ['list1', '0']), 'list1_elem0');
    assert.strictEqual(executeCommand('LINDEX', ['list2', '1']), 'list2_elem1');
    assert.strictEqual(executeCommand('LINDEX', ['list1', '1']), 'list1_elem1');
    assert.strictEqual(executeCommand('LINDEX', ['list2', '0']), 'list2_elem0');
  });

  it('should work after LPUSH and RPUSH operations', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    executeCommand('LPUSH', ['mylist', 'y', 'x']);
    // List is now: x, y, a, b, c

    assert.strictEqual(executeCommand('LINDEX', ['mylist', '0']), 'x');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '1']), 'y');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '2']), 'a');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '-1']), 'c');
    assert.strictEqual(executeCommand('LINDEX', ['mylist', '-2']), 'b');
  });

  it('should not modify list when accessing elements', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    executeCommand('LINDEX', ['mylist', '0']);
    executeCommand('LINDEX', ['mylist', '1']);
    executeCommand('LINDEX', ['mylist', '-1']);
    const length = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(length, 3);
  });
});
