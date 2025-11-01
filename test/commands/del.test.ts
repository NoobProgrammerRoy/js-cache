import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('DEL command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should delete a key and return 1', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('DEL', ['key']);
    assert.strictEqual(result, 1);
    const getResult = executeCommand('GET', ['key']);
    assert.strictEqual(getResult, null);
  });

  it('should delete multiple keys', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('DEL', ['key1', 'key2']);
    assert.strictEqual(result, 2);
  });

  it('should return 0 for non-existent keys', () => {
    const result = executeCommand('DEL', ['nonexistent']);
    assert.strictEqual(result, 0);
  });

  it('should handle partial deletion', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('DEL', ['key1', 'nonexistent']);
    assert.strictEqual(result, 1);
  });
});
