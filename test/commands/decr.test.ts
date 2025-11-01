import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('DECR command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should decrement existing numeric value', () => {
    executeCommand('SET', ['counter', '5']);
    const result = executeCommand('DECR', ['counter']);
    assert.strictEqual(result, 4);
    const getResult = executeCommand('GET', ['counter']);
    assert.strictEqual(getResult, '4');
  });

  it('should start at -1 for non-existent key', () => {
    const result = executeCommand('DECR', ['newdecr']);
    assert.strictEqual(result, -1);
  });

  it('should throw for non-numeric value', () => {
    executeCommand('SET', ['notanumber', 'hello']);
    assert.throws(() => {
      executeCommand('DECR', ['notanumber']);
    }, RespError);
  });

  it('should decrement from 0', () => {
    executeCommand('SET', ['zero', '0']);
    const result = executeCommand('DECR', ['zero']);
    assert.strictEqual(result, -1);
  });

  it('should handle negative numbers', () => {
    executeCommand('SET', ['negative', '-5']);
    const result = executeCommand('DECR', ['negative']);
    assert.strictEqual(result, -6);
  });

  it('should handle large numbers', () => {
    executeCommand('SET', ['large', '-9007199254740991']); // Min safe integer
    const result = executeCommand('DECR', ['large']);
    assert.strictEqual(result, -9007199254740992);
  });

  it('should persist decremented value', () => {
    executeCommand('SET', ['x', '10']);
    executeCommand('DECR', ['x']);
    executeCommand('DECR', ['x']);
    const result = executeCommand('DECR', ['x']);
    assert.strictEqual(result, 7);
  });
});
