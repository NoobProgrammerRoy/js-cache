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

  it('should push special characters', () => {
    const result = executeCommand('LPUSH', [
      'mylist',
      '!@#$%',
      'hello world',
      '',
    ]);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['', 'hello world', '!@#$%']);
  });

  it('should push unicode characters', () => {
    const result = executeCommand('LPUSH', ['mylist', '世界', '你好']);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['你好', '世界']);
  });

  it('should push emoji characters', () => {
    const result = executeCommand('LPUSH', ['mylist', '😀', '😁', '😂']);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['😂', '😁', '😀']);
  });

  it('should preserve exact string content including whitespace', () => {
    const result = executeCommand('LPUSH', [
      'mylist',
      '  leading',
      'trailing  ',
      ' both ',
    ]);
    assert.strictEqual(result, 3);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, [' both ', 'trailing  ', '  leading']);
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

  it('should push to same list multiple times incrementally', () => {
    let result = executeCommand('LPUSH', ['mylist', 'a']);
    assert.strictEqual(result, 1);

    result = executeCommand('LPUSH', ['mylist', 'b']);
    assert.strictEqual(result, 2);

    result = executeCommand('LPUSH', ['mylist', 'c']);
    assert.strictEqual(result, 3);

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['c', 'b', 'a']);
  });

  it('should handle very long string values', () => {
    const longString = 'x'.repeat(10000);
    const result = executeCommand('LPUSH', ['mylist', longString]);
    assert.strictEqual(result, 1);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, [longString]);
  });

  it('should handle newlines and special control characters', () => {
    const result = executeCommand('LPUSH', [
      'mylist',
      'line1\nline2',
      'tab\tseparated',
    ]);
    assert.strictEqual(result, 2);
    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['tab\tseparated', 'line1\nline2']);
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

  it('should return updated list length after consecutive LPUSH commands', () => {
    let result = executeCommand('LPUSH', ['mylist', 'a', 'b']);
    assert.strictEqual(result, 2);

    result = executeCommand('LPUSH', ['mylist', 'c', 'd', 'e']);
    assert.strictEqual(result, 5);

    const range = executeCommand('LRANGE', ['mylist', '0', '-1']);
    assert.deepStrictEqual(range, ['e', 'd', 'c', 'b', 'a']);
  });
});
