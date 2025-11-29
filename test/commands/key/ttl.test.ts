import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('TTL command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return -2 for non-existent key', () => {
    const result = executeCommand('TTL', ['nonexistent']);
    assert.strictEqual(result, -2);
  });

  it('should return -1 for key without expiration', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('TTL', ['mykey']);
    assert.strictEqual(result, -1);
  });

  it('should return remaining seconds for key with expiration', () => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '10']);
    const ttl = executeCommand('TTL', ['mykey']) as number;
    assert.ok(ttl > 0 && ttl <= 10);
  });

  it('should return decreasing TTL over time', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '100']);
    const ttl1 = executeCommand('TTL', ['mykey']) as number;

    setTimeout(() => {
      const ttl2 = executeCommand('TTL', ['mykey']) as number;
      assert.ok(ttl2 < ttl1);
      done();
    }, 2000);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('TTL', []), RespError);
  });

  it('should return -2 after key expires', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '1']);

    setTimeout(() => {
      const result = executeCommand('TTL', ['mykey']);
      assert.strictEqual(result, -2);
      done();
    }, 1100);
  });
});
