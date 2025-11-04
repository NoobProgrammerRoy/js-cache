import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('MSET command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should set multiple key-value pairs', () => {
    const result = executeCommand('MSET', ['key1', 'Hello', 'key2', 'World']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key1']), 'Hello');
    assert.strictEqual(executeCommand('GET', ['key2']), 'World');
  });

  it('should replace existing values', () => {
    executeCommand('SET', ['key1', 'old']);
    executeCommand('SET', ['key2', 'old']);
    const result = executeCommand('MSET', ['key1', 'new1', 'key2', 'new2']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key1']), 'new1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'new2');
  });

  it('should set single key-value pair', () => {
    const result = executeCommand('MSET', ['mykey', 'myvalue']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['mykey']), 'myvalue');
  });

  it('should handle numeric string values', () => {
    const result = executeCommand('MSET', ['num1', '123', 'num2', '456']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['num1']), '123');
    assert.strictEqual(executeCommand('GET', ['num2']), '456');
  });

  it('should overwrite previous MSET', () => {
    executeCommand('MSET', ['key1', 'value1', 'key2', 'value2']);
    const result = executeCommand('MSET', ['key1', 'newvalue']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key1']), 'newvalue');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value2');
  });

  it('should work with many key-value pairs', () => {
    const args: string[] = [];
    for (let i = 0; i < 100; i++) {
      args.push(`key${i}`, `value${i}`);
    }
    const result = executeCommand('MSET', args);
    assert.strictEqual(result, 'OK');
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(executeCommand('GET', [`key${i}`]), `value${i}`);
    }
  });

  it('should work with special characters', () => {
    const result = executeCommand('MSET', [
      'special1',
      '!@#$%^&*()',
      'special2',
      '[]{}|\\',
    ]);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['special1']), '!@#$%^&*()');
    assert.strictEqual(executeCommand('GET', ['special2']), '[]{}|\\');
  });

  it('should work with spaces and newlines', () => {
    const result = executeCommand('MSET', [
      'text1',
      'Hello World',
      'text2',
      'Line1\nLine2',
    ]);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['text1']), 'Hello World');
    assert.strictEqual(executeCommand('GET', ['text2']), 'Line1\nLine2');
  });

  it('should work with unicode characters', () => {
    const result = executeCommand('MSET', [
      'unicode1',
      'Hello 世界',
      'unicode2',
      '🎉🎊',
    ]);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['unicode1']), 'Hello 世界');
    assert.strictEqual(executeCommand('GET', ['unicode2']), '🎉🎊');
  });

  it('should work with long strings', () => {
    const longStr = 'a'.repeat(10000);
    const result = executeCommand('MSET', [
      'longkey1',
      longStr,
      'longkey2',
      longStr,
    ]);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['longkey1']), longStr);
    assert.strictEqual(executeCommand('GET', ['longkey2']), longStr);
  });

  it('should be atomic - all keys set together', () => {
    executeCommand('MSET', [
      'key1',
      'value1',
      'key2',
      'value2',
      'key3',
      'value3',
    ]);
    const key1 = executeCommand('GET', ['key1']);
    const key2 = executeCommand('GET', ['key2']);
    const key3 = executeCommand('GET', ['key3']);
    assert.strictEqual(key1, 'value1');
    assert.strictEqual(key2, 'value2');
    assert.strictEqual(key3, 'value3');
  });

  it('should replace values from different sources', () => {
    executeCommand('SET', ['key1', 'old1']);
    executeCommand('INCR', ['key2']);
    const result = executeCommand('MSET', ['key1', 'new1', 'key2', 'new2']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key1']), 'new1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'new2');
  });

  it('should handle empty string values', () => {
    const result = executeCommand('MSET', ['empty1', '', 'empty2', '']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['empty1']), '');
    assert.strictEqual(executeCommand('GET', ['empty2']), '');
  });

  it('should throw for missing value in key-value pairs', () => {
    assert.throws(
      () => executeCommand('MSET', ['key1']),
      (err) => err instanceof RespError
    );
  });

  it('should throw for odd number of arguments', () => {
    assert.throws(
      () => executeCommand('MSET', ['key1', 'value1', 'key2']),
      (err) => err instanceof RespError
    );
  });

  it('should throw with no arguments', () => {
    assert.throws(
      () => executeCommand('MSET', []),
      (err) => err instanceof RespError
    );
  });

  it('should work after MGET operations', () => {
    const result = executeCommand('MSET', ['key1', 'value1', 'key2', 'value2']);
    assert.strictEqual(result, 'OK');
    const values = executeCommand('MGET', ['key1', 'key2']);
    assert.ok(Array.isArray(values));
    assert.strictEqual(values[0], 'value1');
    assert.strictEqual(values[1], 'value2');
  });

  it('should work with keys that had different types before', () => {
    executeCommand('INCR', ['key1']);
    executeCommand('APPEND', ['key2', 'text']);
    const result = executeCommand('MSET', [
      'key1',
      'string1',
      'key2',
      'string2',
    ]);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key1']), 'string1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'string2');
  });

  it('should handle duplicate keys in MSET', () => {
    const result = executeCommand('MSET', ['key1', 'first', 'key1', 'second']);
    assert.strictEqual(result, 'OK');
    // Last value should win
    assert.strictEqual(executeCommand('GET', ['key1']), 'second');
  });

  it('should work with many overlapping updates', () => {
    executeCommand('MSET', ['key1', 'initial']);
    executeCommand('MSET', ['key1', 'updated']);
    executeCommand('MSET', ['key1', 'final']);
    assert.strictEqual(executeCommand('GET', ['key1']), 'final');
  });
});
