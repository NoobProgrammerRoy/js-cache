import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('SET command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should set a key-value pair', () => {
    const result = executeCommand('SET', ['mykey', 'myvalue']);
    assert.strictEqual(result, 'OK');
  });

  it('should overwrite existing key', () => {
    executeCommand('SET', ['key', 'value1']);
    executeCommand('SET', ['key', 'value2']);
    const getResult = executeCommand('GET', ['key']);
    assert.strictEqual(getResult, 'value2');
  });

  it('should handle string values', () => {
    const result = executeCommand('SET', ['stringkey', 'stringvalue']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['stringkey']);
    assert.strictEqual(getValue, 'stringvalue');
  });

  it('should handle numeric string values', () => {
    const result = executeCommand('SET', ['numkey', '42']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['numkey']);
    assert.strictEqual(getValue, '42');
  });
});
