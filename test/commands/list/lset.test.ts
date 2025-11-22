import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LSET command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set element at positive index 0', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '0', 'new_one']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '0']);
    assert.strictEqual(element, 'new_one');
  });

  it('should set element at positive index 1', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '1', 'new_two']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '1']);
    assert.strictEqual(element, 'new_two');
  });

  it('should set element at positive index 2', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '2', 'new_three']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '2']);
    assert.strictEqual(element, 'new_three');
  });

  it('should set element at negative index -1 (last element)', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '-1', 'new_last']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '-1']);
    assert.strictEqual(element, 'new_last');
  });

  it('should set element at negative index -2', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '-2', 'new_middle']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '-2']);
    assert.strictEqual(element, 'new_middle');
  });

  it('should set element at negative index -3 (first element)', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    const result = executeCommand('LSET', ['mylist', '-3', 'new_first']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '-3']);
    assert.strictEqual(element, 'new_first');
  });

  it('should throw error for out-of-range positive index', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    assert.throws(
      () => executeCommand('LSET', ['mylist', '3', 'value']),
      RespError
    );
  });

  it('should throw error for out-of-range negative index', () => {
    executeCommand('RPUSH', ['mylist', 'one', 'two', 'three']);
    assert.throws(
      () => executeCommand('LSET', ['mylist', '-4', 'value']),
      RespError
    );
  });

  it('should throw error for non-existent key', () => {
    assert.throws(
      () => executeCommand('LSET', ['nonexistent', '0', 'value']),
      RespError
    );
  });

  it('should throw WRONGTYPE error for string value', () => {
    executeCommand('SET', ['stringkey', 'stringvalue']);
    assert.throws(
      () => executeCommand('LSET', ['stringkey', '0', 'value']),
      RespError
    );
  });

  it('should throw WRONGTYPE error for number value', () => {
    executeCommand('SET', ['numberkey', '42']);
    assert.throws(
      () => executeCommand('LSET', ['numberkey', '0', 'value']),
      RespError
    );
  });

  it('should throw error for missing arguments (key only)', () => {
    assert.throws(() => executeCommand('LSET', ['key']), RespError);
  });

  it('should throw error for missing arguments (key and index only)', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(() => executeCommand('LSET', ['mylist', '0']), RespError);
  });

  it('should throw error for non-integer index', () => {
    executeCommand('RPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LSET', ['mylist', 'notanumber', 'value']),
      RespError
    );
  });

  it('should work with single-element list', () => {
    executeCommand('RPUSH', ['mylist', 'single']);
    const result = executeCommand('LSET', ['mylist', '0', 'updated']);
    assert.strictEqual(result, 'OK');
    const element = executeCommand('LINDEX', ['mylist', '0']);
    assert.strictEqual(element, 'updated');
  });

  it('should work with multiple keys in store', () => {
    executeCommand('RPUSH', ['list1', 'a', 'b', 'c']);
    executeCommand('RPUSH', ['list2', 'x', 'y', 'z']);

    const result1 = executeCommand('LSET', ['list1', '0', 'A']);
    const result2 = executeCommand('LSET', ['list2', '1', 'Y']);
    assert.strictEqual(result1, 'OK');
    assert.strictEqual(result2, 'OK');

    const elem1 = executeCommand('LINDEX', ['list1', '0']);
    const elem2 = executeCommand('LINDEX', ['list2', '1']);
    assert.strictEqual(elem1, 'A');
    assert.strictEqual(elem2, 'Y');
  });

  it('should set multiple elements in same list', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e']);

    executeCommand('LSET', ['mylist', '0', 'A']);
    executeCommand('LSET', ['mylist', '2', 'C']);
    executeCommand('LSET', ['mylist', '-1', 'E']);

    const all = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(all, ['A', 'b', 'C', 'd', 'E']);
  });

  it('should preserve list length after LSET', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    const beforeLen = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(beforeLen, 3);

    executeCommand('LSET', ['mylist', '1', 'updated']);

    const afterLen = executeCommand('LLEN', ['mylist']);
    assert.strictEqual(afterLen, 3);
  });

  it('should work after LPUSH and RPUSH operations', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    executeCommand('LPUSH', ['mylist', 'y', 'x']);
    // List is now: x, y, a, b, c

    const result = executeCommand('LSET', ['mylist', '1', 'Y']);
    assert.strictEqual(result, 'OK');

    const elem = executeCommand('LINDEX', ['mylist', '1']);
    assert.strictEqual(elem, 'Y');

    const all = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(all, ['x', 'Y', 'a', 'b', 'c']);
  });

  it('should work with combined LPOP/RPOP and LSET', () => {
    executeCommand('RPUSH', ['mylist', 'a', 'b', 'c', 'd', 'e']);
    executeCommand('LPOP', ['mylist']);
    executeCommand('RPOP', ['mylist']);
    // List is now: b, c, d

    const result = executeCommand('LSET', ['mylist', '1', 'C']);
    assert.strictEqual(result, 'OK');

    const all = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(all, ['b', 'C', 'd']);
  });
});
