import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('INCR command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should increment existing numeric value', () => {
    executeCommand('SET', ['counter', '5']);
    const result = executeCommand('INCR', ['counter']);
    assert.strictEqual(result, 6);
    const getResult = executeCommand('GET', ['counter']);
    assert.strictEqual(getResult, '6');
  });

  it('should start at 1 for non-existent key', () => {
    const result = executeCommand('INCR', ['newcounter']);
    assert.strictEqual(result, 1);
  });

  it('should throw for non-numeric value', () => {
    executeCommand('SET', ['notanumber', 'hello']);
    assert.throws(() => {
      executeCommand('INCR', ['notanumber']);
    }, RespError);
  });

  it('should increment from 0', () => {
    executeCommand('SET', ['zero', '0']);
    const result = executeCommand('INCR', ['zero']);
    assert.strictEqual(result, 1);
  });

  it('should handle negative numbers', () => {
    executeCommand('SET', ['negative', '-5']);
    const result = executeCommand('INCR', ['negative']);
    assert.strictEqual(result, -4);
  });

  it('should handle large numbers', () => {
    executeCommand('SET', ['large', '9007199254740991']); // Max safe integer
    const result = executeCommand('INCR', ['large']);
    assert.strictEqual(result, 9007199254740992);
  });

  it('should persist incremented value', () => {
    executeCommand('INCR', ['x']);
    executeCommand('INCR', ['x']);
    const result = executeCommand('INCR', ['x']);
    assert.strictEqual(result, 3);
  });
});
