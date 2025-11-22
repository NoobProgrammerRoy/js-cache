import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('LPUSH command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should push single element to empty list', () => {
    const result = executeCommand('LPUSH', ['mylist', 'world']);
    assert.strictEqual(result, 1);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['world']);
  });

  it('should push single element to existing list', () => {
    executeCommand('LPUSH', ['mylist', 'world']);
    const result = executeCommand('LPUSH', ['mylist', 'hello']);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['hello', 'world']);
  });

  it('should push multiple elements in order', () => {
    const result = executeCommand('LPUSH', ['mylist', 'a', 'b', 'c']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['c', 'b', 'a']);
  });

  it('should handle pushing numeric string values', () => {
    const result = executeCommand('LPUSH', ['mylist', '100', '200', '300']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['300', '200', '100']);
  });

  it('should return error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(
      () => executeCommand('LPUSH', ['mykey', 'element']),
      RespError
    );
  });

  it('should return error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(
      () => executeCommand('LPUSH', ['mykey', 'element']),
      RespError
    );
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('LPUSH', []), RespError);
  });

  it('should throw error with only key argument', () => {
    assert.throws(() => executeCommand('LPUSH', ['mylist']), RespError);
  });

  it('should maintain list after LPUSH with multiple keys in store', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('LPUSH', ['mylist', 'a', 'b']);
    assert.strictEqual(result, 2);

    // Verify other keys are unaffected
    assert.strictEqual(executeCommand('GET', ['key1']), 'value1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value2');

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['b', 'a']);
  });
});
