import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LRANGE command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return empty array for non-existent key', () => {
    const result = executeCommand('LRANGE', ['nonexistent', '0', '-1']);
    assert.deepStrictEqual(result, []);
  });

  it('should return single element with matching start and stop', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '0', '0']);
    assert.deepStrictEqual(result, ['one']);
  });

  it('should return multiple elements from start to stop', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '0', '2']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should return elements with negative indices', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '-3', '2']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should return last element with negative index -1', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '-1', '-1']);
    assert.deepStrictEqual(result, ['three']);
  });

  it('should return all elements with LRANGE 0 -1', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should handle out of range indices gracefully', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '-100', '100']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should return empty array when start is larger than end', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '2', '1']);
    assert.deepStrictEqual(result, []);
  });

  it('should return empty array when start is beyond list length', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '5', '10']);
    assert.deepStrictEqual(result, []);
  });

  it('should handle single element list', () => {
    executeCommand('LPUSH', ['mylist', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(result, ['one']);
  });

  it('should handle partial range from middle', () => {
    executeCommand('LPUSH', ['mylist', 'five', 'four', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '1', '3']);
    assert.deepStrictEqual(result, ['two', 'three', 'four']);
  });

  it('should handle negative start with positive stop', () => {
    executeCommand('LPUSH', ['mylist', 'five', 'four', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '-2', '4']);
    assert.deepStrictEqual(result, ['four', 'five']);
  });

  it('should handle negative indices at both ends', () => {
    executeCommand('LPUSH', ['mylist', 'five', 'four', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '-3', '-1']);
    assert.deepStrictEqual(result, ['three', 'four', 'five']);
  });

  it('should throw error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(
      () => executeCommand('LRANGE', ['mykey', '0', '-1']),
      RespError
    );
  });

  it('should throw error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(
      () => executeCommand('LRANGE', ['mykey', '0', '-1']),
      RespError
    );
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('LRANGE', []), RespError);
  });

  it('should throw error with only key argument', () => {
    assert.throws(() => executeCommand('LRANGE', ['mylist']), RespError);
  });

  it('should throw error with only key and start arguments', () => {
    assert.throws(() => executeCommand('LRANGE', ['mylist', '0']), RespError);
  });

  it('should throw error when start is not an integer', () => {
    executeCommand('LPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LRANGE', ['mylist', 'abc', '0']),
      RespError
    );
  });

  it('should throw error when stop is not an integer', () => {
    executeCommand('LPUSH', ['mylist', 'one']);
    assert.throws(
      () => executeCommand('LRANGE', ['mylist', '0', 'xyz']),
      RespError
    );
  });

  it('should maintain list after LRANGE operations', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    executeCommand('LRANGE', ['mylist', '0', '1']);
    executeCommand('LRANGE', ['mylist', '1', '2']);
    const result = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should handle zero start index correctly', () => {
    executeCommand('LPUSH', ['mylist', 'five', 'four', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '0', '2']);
    assert.deepStrictEqual(result, ['one', 'two', 'three']);
  });

  it('should handle boundary case with stop beyond list', () => {
    executeCommand('LPUSH', ['mylist', 'three', 'two', 'one']);
    const result = executeCommand('LRANGE', ['mylist', '1', '1000']);
    assert.deepStrictEqual(result, ['two', 'three']);
  });
});
