import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('FLUSHALL command', () => {
  beforeEach(() => {
    setupStore();
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

  it('should clear multiple keys', () => {
    executeCommand('SET', ['a', '1']);
    executeCommand('SET', ['b', '2']);
    executeCommand('SET', ['c', '3']);
    executeCommand('FLUSHALL', []);
    assert.strictEqual(executeCommand('EXISTS', ['a', 'b', 'c']), 0);
  });
});
