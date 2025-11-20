import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SET command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
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

  it('should handle numeric string values', () => {
    const result = executeCommand('SET', ['numkey', '42']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['numkey']);
    assert.strictEqual(getValue, '42');
  });
});
