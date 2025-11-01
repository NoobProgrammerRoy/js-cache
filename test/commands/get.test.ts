import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('GET command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should get an existing value', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('GET', ['key']);
    assert.strictEqual(result, 'value');
  });

  it('should return null for non-existent key', () => {
    const result = executeCommand('GET', ['nonexistent']);
    assert.strictEqual(result, null);
  });

  it('should get numeric string values', () => {
    executeCommand('SET', ['num', '42']);
    const result = executeCommand('GET', ['num']);
    assert.strictEqual(result, '42');
  });

  it('should get value after overwrite', () => {
    executeCommand('SET', ['key', 'value1']);
    executeCommand('SET', ['key', 'value2']);
    const result = executeCommand('GET', ['key']);
    assert.strictEqual(result, 'value2');
  });
});
