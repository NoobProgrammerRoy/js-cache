import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('STRLEN command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should return length of string value', () => {
    executeCommand('SET', ['mykey', 'Hello world']);
    const result = executeCommand('STRLEN', ['mykey']);
    assert.strictEqual(result, 11);
  });

  it('should return 0 for non-existent key', () => {
    const result = executeCommand('STRLEN', ['nonexisting']);
    assert.strictEqual(result, 0);
  });

  it('should return length of empty string', () => {
    executeCommand('SET', ['emptykey', 'x']);
    executeCommand('DEL', ['emptykey']);
    const result = executeCommand('STRLEN', ['emptykey']);
    assert.strictEqual(result, 0);
  });

  it('should return length of single character', () => {
    executeCommand('SET', ['singlechar', 'a']);
    const result = executeCommand('STRLEN', ['singlechar']);
    assert.strictEqual(result, 1);
  });

  it('should work with string that contains numbers', () => {
    executeCommand('SET', ['mixedkey', 'abc123def']);
    const result = executeCommand('STRLEN', ['mixedkey']);
    assert.strictEqual(result, 9);
  });

  it('should work when key holds numeric value (stored as number)', () => {
    executeCommand('SET', ['numkey', '123456789']);
    const result = executeCommand('STRLEN', ['numkey']);
    assert.strictEqual(result, 9);
  });

  it('should work with spaces and newlines', () => {
    executeCommand('SET', ['textkey', 'Hello\nWorld']);
    const result = executeCommand('STRLEN', ['textkey']);
    assert.strictEqual(result, 11);
  });

  it('should work with long strings', () => {
    const longStr = 'a'.repeat(10000);
    executeCommand('SET', ['longkey', longStr]);
    const result = executeCommand('STRLEN', ['longkey']);
    assert.strictEqual(result, 10000);
  });

  it('should throw for missing key argument', () => {
    assert.throws(
      () => executeCommand('STRLEN', []),
      (err) => err instanceof RespError
    );
  });

  it('should work with string after SET operation', () => {
    executeCommand('SET', ['key1', 'abc']);
    executeCommand('SET', ['key1', 'abcdef']);
    const result = executeCommand('STRLEN', ['key1']);
    assert.strictEqual(result, 6);
  });

  it('should return correct length after APPEND', () => {
    executeCommand('SET', ['appendkey', 'Hello']);
    executeCommand('APPEND', ['appendkey', ' World']);
    const result = executeCommand('STRLEN', ['appendkey']);
    assert.strictEqual(result, 11);
  });

  it('should return correct length after SETRANGE', () => {
    executeCommand('SET', ['rangekey', 'Hello']);
    executeCommand('SETRANGE', ['rangekey', '6', 'World']);
    const result = executeCommand('STRLEN', ['rangekey']);
    assert.strictEqual(result, 11);
  });

  it('should work with string containing null bytes', () => {
    executeCommand('SETRANGE', ['nullkey', '0', 'Hello']);
    executeCommand('SETRANGE', ['nullkey', '10', 'World']);
    const result = executeCommand('STRLEN', ['nullkey']);
    assert.strictEqual(result, 15);
  });

  it('should work multiple times on same key', () => {
    executeCommand('SET', ['multikey', 'test']);
    assert.strictEqual(executeCommand('STRLEN', ['multikey']), 4);
    assert.strictEqual(executeCommand('STRLEN', ['multikey']), 4);
    assert.strictEqual(executeCommand('STRLEN', ['multikey']), 4);
  });

  it('should work correctly with overwritten key', () => {
    executeCommand('SET', ['overwrite', 'short']);
    assert.strictEqual(executeCommand('STRLEN', ['overwrite']), 5);
    executeCommand('SET', ['overwrite', 'this is much longer']);
    assert.strictEqual(executeCommand('STRLEN', ['overwrite']), 19);
  });
});
