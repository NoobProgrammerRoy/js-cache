import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('APPEND command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should create key if it does not exist', () => {
    const result = executeCommand('APPEND', ['newkey', 'Hello']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['newkey']);
    assert.strictEqual(value, 'Hello');
  });

  it('should append to existing string value', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('APPEND', ['mykey', ' World']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello World');
  });

  it('should append empty string', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('APPEND', ['mykey', '']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello');
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

  it('should work for strings appended with numeric values', () => {
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

  it('should handle long strings', () => {
    const longStr = 'a'.repeat(5000);
    executeCommand('SET', ['longkey', 'prefix']);
    const result = executeCommand('APPEND', ['longkey', longStr]);
    assert.strictEqual(result, 5006);
    const value = executeCommand('GET', ['longkey']);
    assert.strictEqual(value, 'prefix' + longStr);
  });
});
