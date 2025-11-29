import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('EXPIRE command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set expiration on existing key', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('EXPIRE', ['mykey', '10']);
    assert.strictEqual(result, 1);
  });

  it('should return 0 when key does not exist', () => {
    const result = executeCommand('EXPIRE', ['nonexistent', '10']);
    assert.strictEqual(result, 0);
  });

  it('should return 0 when setting expiration on already-expired key', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '1']);
    // Wait for key to expire
    setTimeout(() => {
      const result = executeCommand('EXPIRE', ['mykey', '10']);
      assert.strictEqual(result, 0);
      done();
    }, 1100);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('EXPIRE', ['key']), RespError);
  });

  it('should throw error for non-integer seconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    assert.throws(
      () => executeCommand('EXPIRE', ['mykey', 'notanumber']),
      RespError
    );
  });

  it('should expire key after specified seconds', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '1']);

    assert.strictEqual(executeCommand('GET', ['mykey']), 'value');

    setTimeout(() => {
      assert.strictEqual(executeCommand('GET', ['mykey']), null);
      done();
    }, 1100);
  });

  it('should immediately expire key with negative milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('EXPIRE', ['mykey', '-1']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });

  it('should immediately expire key with zero milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('EXPIRE', ['mykey', '0']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });
});
