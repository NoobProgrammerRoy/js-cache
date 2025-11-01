import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('GETDEL command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should get and delete an existing key', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('GETDEL', ['key']);
    assert.strictEqual(result, 'value');
    const getResult = executeCommand('GET', ['key']);
    assert.strictEqual(getResult, null);
  });

  it('should return null for non-existent key', () => {
    const result = executeCommand('GETDEL', ['nonexistent']);
    assert.strictEqual(result, null);
  });

  it('should throw for wrong number of arguments', () => {
    assert.throws(() => {
      executeCommand('GETDEL', []);
    }, RespError);
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['num', '42']);
    const result = executeCommand('GETDEL', ['num']);
    assert.strictEqual(result, '42');
    const getResult = executeCommand('GET', ['num']);
    assert.strictEqual(getResult, null);
  });

  it('should only delete the specified key', () => {
    executeCommand('SET', ['key1', 'value1']);
    executeCommand('SET', ['key2', 'value2']);
    const result = executeCommand('GETDEL', ['key1']);
    assert.strictEqual(result, 'value1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value2');
  });

  it('should handle multiple getdel calls', () => {
    executeCommand('SET', ['a', 'val1']);
    executeCommand('SET', ['b', 'val2']);
    assert.strictEqual(executeCommand('GETDEL', ['a']), 'val1');
    assert.strictEqual(executeCommand('GETDEL', ['b']), 'val2');
    assert.strictEqual(executeCommand('GETDEL', ['a']), null);
  });
});
