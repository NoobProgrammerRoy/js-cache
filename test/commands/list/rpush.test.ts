import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('RPUSH command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should push single element to empty list', () => {
    const result = executeCommand('RPUSH', ['mylist', 'world']);
    assert.strictEqual(result, 1);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['world']);
  });

  it('should push single element to existing list', () => {
    executeCommand('RPUSH', ['mylist', 'hello']);
    const result = executeCommand('RPUSH', ['mylist', 'world']);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['hello', 'world']);
  });

  it('should push multiple elements in order', () => {
    const result = executeCommand('RPUSH', ['mylist', 'a', 'b', 'c']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['a', 'b', 'c']);
  });

  it('should handle pushing numeric string values', () => {
    const result = executeCommand('RPUSH', ['mylist', '100', '200', '300']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['100', '200', '300']);
  });

  it('should push special characters', () => {
    const result = executeCommand('RPUSH', [
      'mylist',
      'hello world',
      '!@#$%',
      '',
    ]);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['hello world', '!@#$%', '']);
  });

  it('should push unicode characters', () => {
    const result = executeCommand('RPUSH', ['mylist', '你好', '世界']);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['你好', '世界']);
  });

  it('should push emoji characters', () => {
    const result = executeCommand('RPUSH', ['mylist', '😀', '😁', '😂']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['😀', '😁', '😂']);
  });

  it('should preserve exact string content including whitespace', () => {
    const result = executeCommand('RPUSH', [
      'mylist',
      '  leading',
      'trailing  ',
      ' both ',
    ]);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['  leading', 'trailing  ', ' both ']);
  });

  it('should return error when key holds a string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(
      () => executeCommand('RPUSH', ['mykey', 'element']),
      RespError
    );
  });

  it('should return error when key holds a number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(
      () => executeCommand('RPUSH', ['mykey', 'element']),
      RespError
    );
  });

  it('should throw error with no arguments', () => {
    assert.throws(() => executeCommand('RPUSH', []), RespError);
  });

  it('should throw error with only key argument', () => {
    assert.throws(() => executeCommand('RPUSH', ['mylist']), RespError);
  });

  it('should push to same list multiple times incrementally', () => {
    let result = executeCommand('RPUSH', ['mylist', 'a']);
    assert.strictEqual(result, 1);

    result = executeCommand('RPUSH', ['mylist', 'b']);
    assert.strictEqual(result, 2);

    result = executeCommand('RPUSH', ['mylist', 'c']);
    assert.strictEqual(result, 3);

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['a', 'b', 'c']);
  });

  it('should handle very long string values', () => {
    const longString = 'x'.repeat(10000);
    const result = executeCommand('RPUSH', ['mylist', longString]);
    assert.strictEqual(result, 1);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, [longString]);
  });

  it('should handle newlines and special control characters', () => {
    const result = executeCommand('RPUSH', [
      'mylist',
      'line1\nline2',
      'tab\tseparated',
    ]);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['line1\nline2', 'tab\tseparated']);
  });

  it('should maintain list after RPUSH with multiple keys in store', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('RPUSH', ['mylist', 'a', 'b']);
    assert.strictEqual(result, 2);

    // Verify other keys are unaffected
    assert.strictEqual(executeCommand('GET', ['key1']), 'value1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value2');

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['a', 'b']);
  });

  it('should return updated list length after consecutive RPUSH commands', () => {
    let result = executeCommand('RPUSH', ['mylist', 'a', 'b']);
    assert.strictEqual(result, 2);

    result = executeCommand('RPUSH', ['mylist', 'c', 'd', 'e']);
    assert.strictEqual(result, 5);

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['a', 'b', 'c', 'd', 'e']);
  });

  it('should combine LPUSH and RPUSH operations', () => {
    executeCommand('LPUSH', ['mylist', 'first']);
    executeCommand('RPUSH', ['mylist', 'second']);
    executeCommand('LPUSH', ['mylist', 'zero']);
    executeCommand('RPUSH', ['mylist', 'third']);

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['zero', 'first', 'second', 'third']);
  });

  it('should handle large lists with RPUSH', () => {
    const largeArray = Array.from({ length: 100 }, (_, i) => String(i));
    for (let i = 0; i < 100; i++) {
      executeCommand('RPUSH', ['mylist', String(i)]);
    }
    const result = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(result, largeArray);
  });

  it('should work with empty string elements', () => {
    const result = executeCommand('RPUSH', ['mylist', '', 'middle', '']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['', 'middle', '']);
  });
});
