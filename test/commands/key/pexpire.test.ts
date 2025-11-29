import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('PEXPIRE command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set expiration on existing key in milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('PEXPIRE', ['mykey', '5000']);
    assert.strictEqual(result, 1);
  });

  it('should return 0 when key does not exist', () => {
    const result = executeCommand('PEXPIRE', ['nonexistent', '5000']);
    assert.strictEqual(result, 0);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('PEXPIRE', ['key']), RespError);
  });

  it('should throw error for non-integer milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    assert.throws(
      () => executeCommand('PEXPIRE', ['mykey', 'notanumber']),
      RespError
    );
  });

  it('should expire key after specified milliseconds', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('PEXPIRE', ['mykey', '500']);

    assert.strictEqual(executeCommand('GET', ['mykey']), 'value');

    setTimeout(() => {
      assert.strictEqual(executeCommand('GET', ['mykey']), null);
      done();
    }, 600);
  });

  it('should immediately expire key with negative milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('PEXPIRE', ['mykey', '-1']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });

  it('should immediately expire key with zero milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('PEXPIRE', ['mykey', '0']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });
});
