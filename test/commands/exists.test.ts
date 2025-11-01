import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('EXISTS command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should return count of existing keys', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('EXISTS', ['key1', 'key2', 'nonexistent']);
    assert.strictEqual(result, 2);
  });

  it('should return 0 when no keys exist', () => {
    const result = executeCommand('EXISTS', ['nonexistent']);
    assert.strictEqual(result, 0);
  });

  it('should handle single key', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('EXISTS', ['key']);
    assert.strictEqual(result, 1);
  });

  it('should handle multiple non-existent keys', () => {
    const result = executeCommand('EXISTS', [
      'nonexistent1',
      'nonexistent2',
      'nonexistent3',
    ]);
    assert.strictEqual(result, 0);
  });
});
