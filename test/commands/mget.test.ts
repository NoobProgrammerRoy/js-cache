import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('MGET command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should return values of multiple existing keys', () => {
    executeCommand('SET', ['key1', 'Hello']);
    executeCommand('SET', ['key2', 'World']);
    const result = executeCommand('MGET', ['key1', 'key2']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'Hello');
    assert.strictEqual(result[1], 'World');
  });

  it('should return nil for non-existent keys', () => {
    executeCommand('SET', ['key1', 'Hello']);
    const result = executeCommand('MGET', ['key1', 'nonexisting']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'Hello');
    assert.strictEqual(result[1], null);
  });

  it('should return nil for all non-existent keys', () => {
    const result = executeCommand('MGET', ['nonexisting1', 'nonexisting2']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], null);
    assert.strictEqual(result[1], null);
  });

  it('should return single value for single key', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('MGET', ['mykey']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'value');
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['num1', 'abc123']);
    executeCommand('SET', ['num2', '456def']);
    const result = executeCommand('MGET', ['num1', 'num2']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'abc123');
    assert.strictEqual(result[1], '456def');
  });

  it('should mix strings and nils', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key3', 'value3']);
    const result = executeCommand('MGET', ['key1', 'key2', 'key3', 'key4']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0], 'value1');
    assert.strictEqual(result[1], null);
    assert.strictEqual(result[2], 'value3');
    assert.strictEqual(result[3], null);
  });

  it('should work with special characters in values', () => {
    executeCommand('SET', ['special', '!@#$%^&*()']);
    const result = executeCommand('MGET', ['special']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], '!@#$%^&*()');
  });

  it('should work with spaces and newlines', () => {
    executeCommand('SET', ['text', 'Hello\nWorld']);
    const result = executeCommand('MGET', ['text']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], 'Hello\nWorld');
  });

  it('should work with unicode characters', () => {
    executeCommand('SET', ['unicode', 'Hello 世界']);
    const result = executeCommand('MGET', ['unicode']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], 'Hello 世界');
  });

  it('should work with many keys', () => {
    for (let i = 0; i < 100; i++) {
      executeCommand('SET', [`key${i}`, `value${i}`]);
    }
    const keys = [];
    for (let i = 0; i < 100; i++) {
      keys.push(`key${i}`);
    }
    const result = executeCommand('MGET', keys);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 100);
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(result[i], `value${i}`);
    }
  });

  it('should handle duplicate keys', () => {
    executeCommand('SET', ['key1', 'value1']);
    const result = executeCommand('MGET', ['key1', 'key1', 'key1']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], 'value1');
    assert.strictEqual(result[1], 'value1');
    assert.strictEqual(result[2], 'value1');
  });

  it('should throw for missing key argument', () => {
    assert.throws(
      () => executeCommand('MGET', []),
      (err) => err instanceof RespError
    );
  });

  it('should work for numeric values (stored as numbers)', () => {
    executeCommand('INCR', ['counter']);
    const result = executeCommand('MGET', ['counter']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], '1');
  });

  it('should work after SET and APPEND operations', () => {
    executeCommand('SET', ['key1', 'Hello']);
    executeCommand('APPEND', ['key1', ' World']);
    executeCommand('SET', ['key2', 'Redis']);
    const result = executeCommand('MGET', ['key1', 'key2']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'Hello World');
    assert.strictEqual(result[1], 'Redis');
  });

  it('should work after SETRANGE operation', () => {
    executeCommand('SET', ['key1', 'Hello World']);
    executeCommand('SETRANGE', ['key1', '6', 'Redis']);
    const result = executeCommand('MGET', ['key1']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], 'Hello Redis');
  });

  it('should work with long strings', () => {
    const longStr = 'a'.repeat(10000);
    executeCommand('SET', ['longkey', longStr]);
    const result = executeCommand('MGET', ['longkey']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], longStr);
  });

  it('should preserve order of keys', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    executeCommand('SET', ['key3', 'value3']);
    const result = executeCommand('MGET', ['key3', 'key1', 'key2']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], 'value3');
    assert.strictEqual(result[1], 'value1');
    assert.strictEqual(result[2], 'value2');
  });

  it('should work with empty string values', () => {
    executeCommand('SETRANGE', ['emptykey', '0', 'x']);
    executeCommand('SETRANGE', ['emptykey', '0', '']);
    const result = executeCommand('MGET', ['emptykey', 'nonexisting']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result[0], 'x');
    assert.strictEqual(result[1], null);
  });
});
