import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('APPEND command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should append to existing string value', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('APPEND', ['mykey', ' World']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello World');
  });

  it('should create key if it does not exist', () => {
    const result = executeCommand('APPEND', ['newkey', 'Hello']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['newkey']);
    assert.strictEqual(value, 'Hello');
  });

  it('should append empty string', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('APPEND', ['mykey', '']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello');
  });

  it('should append to key that starts as non-existent (becomes string)', () => {
    const result1 = executeCommand('APPEND', ['newkey', 'Hello']);
    assert.strictEqual(result1, 5);
    const result2 = executeCommand('APPEND', ['newkey', ' World']);
    assert.strictEqual(result2, 11);
    const value = executeCommand('GET', ['newkey']);
    assert.strictEqual(value, 'Hello World');
  });

  it('should handle multiple appends', () => {
    executeCommand('APPEND', ['text', 'H']);
    executeCommand('APPEND', ['text', 'e']);
    executeCommand('APPEND', ['text', 'l']);
    executeCommand('APPEND', ['text', 'l']);
    const result = executeCommand('APPEND', ['text', 'o']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['text']);
    assert.strictEqual(value, 'Hello');
  });

  it('should work for non-string value (numeric)', () => {
    executeCommand('SET', ['counter', '42']);
    const result = executeCommand('APPEND', ['counter', 'text']);
    assert.strictEqual(result, 6);
    const value = executeCommand('GET', ['counter']);
    assert.strictEqual(value, '42text');
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['numstr', 'abc123']);
    const result = executeCommand('APPEND', ['numstr', '456']);
    assert.strictEqual(result, 9);
    const value = executeCommand('GET', ['numstr']);
    assert.strictEqual(value, 'abc123456');
  });

  it('should append special characters', () => {
    executeCommand('SET', ['special', 'Hello!@#']);
    const result = executeCommand('APPEND', ['special', '$%^&*()']);
    assert.strictEqual(result, 15);
    const value = executeCommand('GET', ['special']);
    assert.strictEqual(value, 'Hello!@#$%^&*()');
  });

  it('should append with spaces and newlines', () => {
    executeCommand('SET', ['text', 'line1']);
    const result = executeCommand('APPEND', ['text', '\nline2']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['text']);
    assert.strictEqual(value, 'line1\nline2');
  });

  it('should throw when missing key argument', () => {
    assert.throws(
      () => executeCommand('APPEND', []),
      (err) => err instanceof RespError
    );
  });

  it('should throw when missing value argument', () => {
    assert.throws(
      () => executeCommand('APPEND', ['mykey']),
      (err) => err instanceof RespError
    );
  });

  it('should return correct length after append', () => {
    const result1 = executeCommand('APPEND', ['key', 'a']);
    assert.strictEqual(result1, 1);
    const result2 = executeCommand('APPEND', ['key', 'b']);
    assert.strictEqual(result2, 2);
    const result3 = executeCommand('APPEND', ['key', 'c']);
    assert.strictEqual(result3, 3);
  });

  it('should persist appended value', () => {
    executeCommand('SET', ['persist_key', 'value1']);
    executeCommand('APPEND', ['persist_key', '_value2']);
    const value = executeCommand('GET', ['persist_key']);
    assert.strictEqual(value, 'value1_value2');
  });

  it('should handle long strings', () => {
    const longStr = 'a'.repeat(5000);
    executeCommand('SET', ['longkey', 'prefix']);
    const result = executeCommand('APPEND', ['longkey', longStr]);
    assert.strictEqual(result, 5006);
    const value = executeCommand('GET', ['longkey']);
    assert.strictEqual(value, 'prefix' + longStr);
  });
});
