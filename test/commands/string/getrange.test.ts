import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('GETRANGE command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should get substring with positive start and end', () => {
    executeCommand('SET', ['mykey', 'This is a string']);
    const result = executeCommand('GETRANGE', ['mykey', '0', '3']);
    assert.strictEqual(result, 'This');
  });

  it('should get substring with negative start and end', () => {
    executeCommand('SET', ['mykey', 'This is a string']);
    const result = executeCommand('GETRANGE', ['mykey', '-3', '-1']);
    assert.strictEqual(result, 'ing');
  });

  it('should get entire string with 0 and -1', () => {
    executeCommand('SET', ['mykey', 'This is a string']);
    const result = executeCommand('GETRANGE', ['mykey', '0', '-1']);
    assert.strictEqual(result, 'This is a string');
  });

  it('should handle out of range end', () => {
    executeCommand('SET', ['mykey', 'This is a string']);
    const result = executeCommand('GETRANGE', ['mykey', '10', '100']);
    assert.strictEqual(result, 'string');
  });

  it('should return empty string when start > length', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '10', '20']);
    assert.strictEqual(result, '');
  });

  it('should return empty string when non-existent key', () => {
    const result = executeCommand('GETRANGE', ['nonexistent', '0', '5']);
    assert.strictEqual(result, '');
  });

  it('should handle single character range', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '1', '1']);
    assert.strictEqual(result, 'e');
  });

  it('should handle negative start with positive end', () => {
    executeCommand('SET', ['mykey', 'Hello World']);
    const result = executeCommand('GETRANGE', ['mykey', '-5', '10']);
    assert.strictEqual(result, 'World');
  });

  it('should handle positive start with negative end', () => {
    executeCommand('SET', ['mykey', 'Hello World']);
    const result = executeCommand('GETRANGE', ['mykey', '0', '-6']);
    assert.strictEqual(result, 'Hello ');
  });

  it('should get last character with -1 -1', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '-1', '-1']);
    assert.strictEqual(result, 'o');
  });

  it('should get first character with 0 0', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '0', '0']);
    assert.strictEqual(result, 'H');
  });

  it('should return empty string when start > end', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '3', '1']);
    assert.strictEqual(result, '');
  });

  it('should handle large negative offsets', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('GETRANGE', ['mykey', '-100', '-3']);
    // -100 clamped to 0, -3 is position 2 (third from end), so 0 to 2 = "Hel"
    assert.strictEqual(result, 'Hel');
  });

  it('should work with numeric string values (numbers stored as numbers)', () => {
    executeCommand('SET', ['numkey', '123456789']);
    const result = executeCommand('GETRANGE', ['numkey', '2', '5']);
    assert.strictEqual(result, '3456');
  });

  it('should work with empty string', () => {
    executeCommand('SET', ['emptykey', 'x']);
    executeCommand('DEL', ['emptykey']);
    const result = executeCommand('GETRANGE', ['emptykey', '0', '10']);
    assert.strictEqual(result, '');
  });

  it('should handle zero offsets correctly', () => {
    executeCommand('SET', ['mykey', 'abcdef']);
    const result = executeCommand('GETRANGE', ['mykey', '0', '0']);
    assert.strictEqual(result, 'a');
  });

  it('should handle middle substring', () => {
    executeCommand('SET', ['mykey', 'abcdefgh']);
    const result = executeCommand('GETRANGE', ['mykey', '2', '5']);
    assert.strictEqual(result, 'cdef');
  });

  it('should throw for missing key argument', () => {
    assert.throws(
      () => executeCommand('GETRANGE', []),
      (err) => err instanceof RespError
    );
  });

  it('should throw for missing start argument', () => {
    assert.throws(
      () => executeCommand('GETRANGE', ['mykey']),
      (err) => err instanceof RespError
    );
  });

  it('should throw for missing end argument', () => {
    assert.throws(
      () => executeCommand('GETRANGE', ['mykey', '0']),
      (err) => err instanceof RespError
    );
  });

  it('should throw for non-numeric start', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    assert.throws(
      () => executeCommand('GETRANGE', ['mykey', 'abc', '5']),
      (err) =>
        err instanceof RespError && err.message.includes('not an integer')
    );
  });

  it('should throw for non-numeric end', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    assert.throws(
      () => executeCommand('GETRANGE', ['mykey', '0', 'xyz']),
      (err) =>
        err instanceof RespError && err.message.includes('not an integer')
    );
  });

  it('should handle long strings', () => {
    const longStr = 'a'.repeat(10000);
    executeCommand('SET', ['longkey', longStr]);
    const result = executeCommand('GETRANGE', ['longkey', '100', '110']);
    assert.strictEqual(result, longStr.substring(100, 111));
  });
});
