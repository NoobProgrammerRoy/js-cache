import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('PEXPIREAT command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set expiration at unix timestamp in milliseconds', () => {
    executeCommand('SET', ['mykey', 'value']);
    const futureTimestampMs = Date.now() + 10000;
    const result = executeCommand('PEXPIREAT', [
      'mykey',
      futureTimestampMs.toString(),
    ]);
    assert.strictEqual(result, 1);
  });

  it('should return 0 when key does not exist', () => {
    const futureTimestampMs = Date.now() + 10000;
    const result = executeCommand('PEXPIREAT', [
      'nonexistent',
      futureTimestampMs.toString(),
    ]);
    assert.strictEqual(result, 0);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('PEXPIREAT', ['key']), RespError);
  });

  it('should throw error for non-integer timestamp', () => {
    executeCommand('SET', ['mykey', 'value']);
    assert.throws(
      () => executeCommand('PEXPIREAT', ['mykey', 'notanumber']),
      RespError
    );
  });

  it('should expire key at past timestamp immediately', () => {
    executeCommand('SET', ['mykey', 'value']);
    const pastTimestampMs = Date.now() - 10000;
    executeCommand('PEXPIREAT', ['mykey', pastTimestampMs.toString()]);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });
});
