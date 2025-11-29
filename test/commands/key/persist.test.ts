import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('PERSIST command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should remove expiration from key', () => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '10']);
    const result = executeCommand('PERSIST', ['mykey']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('TTL', ['mykey']), -1);
  });

  it('should return 0 for non-existent key', () => {
    const result = executeCommand('PERSIST', ['nonexistent']);
    assert.strictEqual(result, 0);
  });

  it('should return 0 for key without expiration', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('PERSIST', ['mykey']);
    assert.strictEqual(result, 0);
  });

  it('should persist key and prevent expiration', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('EXPIRE', ['mykey', '1']);
    executeCommand('PERSIST', ['mykey']);

    setTimeout(() => {
      // Key should still exist despite expired TTL
      assert.strictEqual(executeCommand('GET', ['mykey']), 'value');
      done();
    }, 1100);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('PERSIST', []), RespError);
  });

  it('should work with different data types', () => {
    executeCommand('LPUSH', ['mylist', 'item']);
    executeCommand('EXPIRE', ['mylist', '10']);
    const result = executeCommand('PERSIST', ['mylist']);
    assert.strictEqual(result, 1);
    assert.strictEqual(executeCommand('TTL', ['mylist']), -1);
  });
});
