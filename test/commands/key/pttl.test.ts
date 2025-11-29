import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('PTTL command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return -2 for non-existent key', () => {
    const result = executeCommand('PTTL', ['nonexistent']);
    assert.strictEqual(result, -2);
  });

  it('should return -1 for key without expiration', () => {
    executeCommand('SET', ['mykey', 'value']);
    const result = executeCommand('PTTL', ['mykey']);
    assert.strictEqual(result, -1);
  });

  it('should return remaining milliseconds for key with expiration', () => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('PEXPIRE', ['mykey', '10000']);
    const pttl = executeCommand('PTTL', ['mykey']) as number;
    assert.ok(pttl > 0 && pttl <= 10000);
  });

  it('should return milliseconds in appropriate precision', () => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('PEXPIRE', ['mykey', '5000']);
    const pttl = executeCommand('PTTL', ['mykey']) as number;
    assert.ok(pttl > 0 && pttl <= 5000);
  });

  it('should throw error for wrong number of arguments', () => {
    assert.throws(() => executeCommand('PTTL', []), RespError);
  });

  it('should return -2 after key expires', (t, done) => {
    executeCommand('SET', ['mykey', 'value']);
    executeCommand('PEXPIRE', ['mykey', '500']);

    setTimeout(() => {
      const result = executeCommand('PTTL', ['mykey']);
      assert.strictEqual(result, -2);
      done();
    }, 600);
  });
});
