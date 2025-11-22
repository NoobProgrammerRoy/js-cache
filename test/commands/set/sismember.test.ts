import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SISMEMBER command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return 1 for existing member', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'a']), 1);
  });

  it('should return 0 for non-existing', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'x']), 0);
  });

  it('should return 0 for non-existent key', () => {
    const result = executeCommand('SISMEMBER', ['nonexistent', 'member']);
    assert.strictEqual(result, 0);
  });

  it('should be case-sensitive and handle exact matches', () => {
    executeCommand('SADD', ['myset', 'Hello', 'hello', 'HELLO']);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'Hello']), 1);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'hello']), 1);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'HeLLo']), 0);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'hell']), 0);
  });

  it('should reflect changes after SADD and SREM operations', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'a']), 1);
    executeCommand('SREM', ['myset', 'a']);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'a']), 0);
    assert.strictEqual(executeCommand('SISMEMBER', ['myset', 'b']), 1);
  });

  it('should work independently across multiple sets', () => {
    executeCommand('SADD', ['set1', 'a']);
    executeCommand('SADD', ['set2', 'x']);
    assert.strictEqual(executeCommand('SISMEMBER', ['set1', 'a']), 1);
    assert.strictEqual(executeCommand('SISMEMBER', ['set1', 'x']), 0);
    assert.strictEqual(executeCommand('SISMEMBER', ['set2', 'x']), 1);
    assert.strictEqual(executeCommand('SISMEMBER', ['set2', 'a']), 0);
  });

  it('should throw WRONGTYPE error for non-set keys', () => {
    executeCommand('SET', ['strkey', 'value']);
    executeCommand('LPUSH', ['listkey', 'item']);
    assert.throws(
      () => executeCommand('SISMEMBER', ['strkey', 'member']),
      RespError
    );
    assert.throws(
      () => executeCommand('SISMEMBER', ['listkey', 'member']),
      RespError
    );
  });

  it('should throw error on invalid argument count', () => {
    assert.throws(() => executeCommand('SISMEMBER', []), RespError);
    assert.throws(() => executeCommand('SISMEMBER', ['key']), RespError);
    assert.throws(
      () => executeCommand('SISMEMBER', ['key', 'member', 'extra']),
      RespError
    );
  });

  it('should handle RENAME and FLUSHALL', () => {
    executeCommand('SADD', ['oldkey', 'a', 'b']);
    executeCommand('RENAME', ['oldkey', 'newkey']);
    assert.strictEqual(executeCommand('SISMEMBER', ['newkey', 'a']), 1);
    assert.strictEqual(executeCommand('SISMEMBER', ['oldkey', 'a']), 0);

    executeCommand('FLUSHALL', []);
    assert.strictEqual(executeCommand('SISMEMBER', ['newkey', 'a']), 0);
  });
});
