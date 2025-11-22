import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('FLUSHALL command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should clear all keys', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('FLUSHALL', []);
    assert.strictEqual(result, 'OK');
    const getResult1 = executeCommand('GET', ['key1']);
    const getResult2 = executeCommand('GET', ['key2']);
    assert.strictEqual(getResult1, null);
    assert.strictEqual(getResult2, null);
  });

  it('should work on empty store', () => {
    const result = executeCommand('FLUSHALL', []);
    assert.strictEqual(result, 'OK');
  });
});
