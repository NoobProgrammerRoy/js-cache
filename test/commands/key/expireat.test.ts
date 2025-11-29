import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('EXPIREAT command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set expiration at unix timestamp', () => {
    executeCommand('SET', ['mykey', 'value']);
    const futureTimestamp = Math.floor(Date.now() / 1000) + 10;
    const result = executeCommand('EXPIREAT', [
      'mykey',
      futureTimestamp.toString(),
    ]);
    assert.strictEqual(result, 1);
  });

  it('should return 0 when key does not exist', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 10;
    const result = executeCommand('EXPIREAT', [
      'nonexistent',
      futureTimestamp.toString(),
    ]);
    assert.strictEqual(result, 0);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('EXPIREAT', ['key']), RespError);
  });

  it('should throw error for non-integer timestamp', () => {
    executeCommand('SET', ['mykey', 'value']);
    assert.throws(
      () => executeCommand('EXPIREAT', ['mykey', 'notanumber']),
      RespError
    );
  });

  it('should expire key at past timestamp immediately', () => {
    executeCommand('SET', ['mykey', 'value']);
    const pastTimestamp = Math.floor(Date.now() / 1000) - 10;
    executeCommand('EXPIREAT', ['mykey', pastTimestamp.toString()]);
    assert.strictEqual(executeCommand('GET', ['mykey']), null);
  });
});
