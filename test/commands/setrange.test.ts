import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('SETRANGE command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should overwrite part of existing string', () => {
    executeCommand('SET', ['key1', 'Hello World']);
    const result = executeCommand('SETRANGE', ['key1', '6', 'Redis']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['key1']);
    assert.strictEqual(value, 'Hello Redis');
  });

  it('should pad with zero-bytes when offset > length', () => {
    const result = executeCommand('SETRANGE', ['key2', '6', 'Redis']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['key2']);
    assert.ok(typeof value === 'string');
    // The string should be padded with null bytes
    assert.strictEqual(value.length, 11);
    assert.strictEqual(value.substring(6), 'Redis');
  });

  it('should replace at beginning of string', () => {
    executeCommand('SET', ['mykey', 'Hello World']);
    const result = executeCommand('SETRANGE', ['mykey', '0', 'Hi']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hillo World');
  });

  it('should replace at end of string', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('SETRANGE', ['mykey', '5', ' World']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello World');
  });

  it('should extend string beyond current length', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('SETRANGE', ['mykey', '10', 'World']);
    // "Hello" (5 chars) + padding (5 null bytes) + "World" (5 chars) = 15
    assert.strictEqual(result, 15);
    const value = executeCommand('GET', ['mykey']);
    assert.ok(typeof value === 'string');
    assert.strictEqual(value.length, 15);
  });

  it('should handle offset 0 on non-existent key', () => {
    const result = executeCommand('SETRANGE', ['newkey', '0', 'Hello']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['newkey']);
    assert.strictEqual(value, 'Hello');
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['numkey', '123456789']);
    const result = executeCommand('SETRANGE', ['numkey', '2', 'XX']);
    assert.strictEqual(result, 9);
    const value = executeCommand('GET', ['numkey']);
    assert.strictEqual(value, '12XX56789');
  });

  it('should replace entire string', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('SETRANGE', ['mykey', '0', 'Goodbye']);
    assert.strictEqual(result, 7);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Goodbye');
  });

  it('should handle empty value to set', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('SETRANGE', ['mykey', '2', '']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello');
  });

  it('should handle single character replacement', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('SETRANGE', ['mykey', '1', 'A']);
    assert.strictEqual(result, 5);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'HAllo');
  });

  it('should handle large offset', () => {
    executeCommand('SET', ['mykey', 'Hi']);
    const result = executeCommand('SETRANGE', ['mykey', '1000', 'x']);
    assert.strictEqual(result, 1001);
    const value = executeCommand('GET', ['mykey']);
    assert.ok(typeof value === 'string');
    assert.strictEqual(value.length, 1001);
    assert.strictEqual(value[1000], 'x');
  });

  it('should overwrite multiple characters', () => {
    executeCommand('SET', ['mykey', 'abcdefgh']);
    const result = executeCommand('SETRANGE', ['mykey', '2', 'XYZ']);
    assert.strictEqual(result, 8);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'abXYZfgh');
  });

  it('should throw for missing key argument', () => {
    assert.throws(
      () => executeCommand('SETRANGE', []),
      (err) => err instanceof RespError
    );
  });

  it('should throw for missing offset argument', () => {
    assert.throws(
      () => executeCommand('SETRANGE', ['mykey']),
      (err) => err instanceof RespError
    );
  });

  it('should throw for missing value argument', () => {
    assert.throws(
      () => executeCommand('SETRANGE', ['mykey', '0']),
      (err) => err instanceof RespError
    );
  });

  it('should throw for non-numeric offset', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    assert.throws(
      () => executeCommand('SETRANGE', ['mykey', 'abc', 'value']),
      (err) =>
        err instanceof RespError && err.message.includes('not an integer')
    );
  });

  it('should throw for negative offset', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    assert.throws(
      () => executeCommand('SETRANGE', ['mykey', '-1', 'value']),
      (err) => err instanceof RespError && err.message.includes('out of range')
    );
  });

  it('should work with special characters', () => {
    executeCommand('SET', ['mykey', 'Hello World']);
    const result = executeCommand('SETRANGE', ['mykey', '6', '!@#$%']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['mykey']);
    assert.strictEqual(value, 'Hello !@#$%');
  });

  it('should persist the change', () => {
    executeCommand('SET', ['persist_key', 'original']);
    executeCommand('SETRANGE', ['persist_key', '0', 'modified']);
    const value = executeCommand('GET', ['persist_key']);
    assert.strictEqual(value, 'modified');
  });

  it('should handle unicode characters', () => {
    executeCommand('SET', ['unicode', 'Hello 世界']);
    const result = executeCommand('SETRANGE', ['unicode', '6', 'World']);
    assert.strictEqual(result, 11);
    const value = executeCommand('GET', ['unicode']);
    assert.strictEqual(value, 'Hello World');
  });
});
