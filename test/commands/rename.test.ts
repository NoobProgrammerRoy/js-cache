import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('RENAME command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should rename a key to a new key', () => {
    executeCommand('SET', ['mykey', 'Hello']);
    const result = executeCommand('RENAME', ['mykey', 'myotherkey']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['myotherkey']), 'Hello');
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });

  it('should overwrite existing key when renaming to it', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('RENAME', ['key1', 'key2']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value1');
    assert.strictEqual(executeCommand('GET', ['key1']), null);
  });

  it('should throw error when source key does not exist', () => {
    assert.throws(
      () => executeCommand('RENAME', ['nonexistent', 'newkey']),
      (err) => err instanceof RespError && err.message.includes('no such key')
    );
  });

  it('should not rename when old key and new key are the same', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('RENAME', ['key', 'key']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key']), 'value');
  });

  it('should rename numeric values', () => {
    executeCommand('SET', ['num1', '42']);
    const result = executeCommand('RENAME', ['num1', 'num2']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['num2']), '42');
    assert.strictEqual(executeCommand('GET', ['num1']), null);
  });

  it('should rename after increment operation', () => {
    executeCommand('INCR', ['counter']);
    const result = executeCommand('RENAME', ['counter', 'mycounter']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['mycounter']), '1');
  });

  it('should rename with empty string values', () => {
    executeCommand('SET', ['emptykey', '']);
    const result = executeCommand('RENAME', ['emptykey', 'neweempty']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['neweempty']), '');
  });

  it('should rename multiple keys sequentially', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    executeCommand('SET', ['key3', 'value3']);
    executeCommand('RENAME', ['key1', 'newkey1']);
    executeCommand('RENAME', ['key2', 'newkey2']);
    const result = executeCommand('RENAME', ['key3', 'newkey3']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['newkey1']), 'value1');
    assert.strictEqual(executeCommand('GET', ['newkey2']), 'value2');
    assert.strictEqual(executeCommand('GET', ['newkey3']), 'value3');
  });

  it('should remove the old key after rename', () => {
    executeCommand('SET', ['old', 'value']);
    executeCommand('RENAME', ['old', 'new']);
    const result = executeCommand('EXISTS', ['old']);
    assert.strictEqual(result, 0);
  });

  it('should throw when missing key argument', () => {
    assert.throws(
      () => executeCommand('RENAME', []),
      (err) => err instanceof RespError
    );
  });

  it('should throw when missing newkey argument', () => {
    executeCommand('SET', ['key', 'value']);
    assert.throws(
      () => executeCommand('RENAME', ['key']),
      (err) => err instanceof RespError
    );
  });

  it('should throw when too many arguments provided', () => {
    executeCommand('SET', ['key', 'value']);
    assert.throws(
      () => executeCommand('RENAME', ['key', 'newkey', 'extra']),
      (err) => err instanceof RespError
    );
  });
});
