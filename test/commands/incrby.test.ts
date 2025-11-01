import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('INCRBY command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should increment existing numeric value by given amount', () => {
    executeCommand('SET', ['counter', '5']);
    const result = executeCommand('INCRBY', ['counter', '3']);
    assert.strictEqual(result, 8);
    const getResult = executeCommand('GET', ['counter']);
    assert.strictEqual(getResult, '8');
  });

  it('should start at 0 and increment for non-existent key', () => {
    const result = executeCommand('INCRBY', ['newcounter', '10']);
    assert.strictEqual(result, 10);
  });

  it('should increment by 1 when increment is 1', () => {
    const result = executeCommand('INCRBY', ['x', '1']);
    assert.strictEqual(result, 1);
  });

  it('should increment by 0 (no-op)', () => {
    executeCommand('SET', ['y', '5']);
    const result = executeCommand('INCRBY', ['y', '0']);
    assert.strictEqual(result, 5);
  });

  it('should handle negative increments', () => {
    executeCommand('SET', ['counter', '10']);
    const result = executeCommand('INCRBY', ['counter', '-3']);
    assert.strictEqual(result, 7);
  });

  it('should handle negative starting values', () => {
    executeCommand('SET', ['neg', '-5']);
    const result = executeCommand('INCRBY', ['neg', '3']);
    assert.strictEqual(result, -2);
  });

  it('should handle large increments', () => {
    executeCommand('SET', ['large', '1000000']);
    const result = executeCommand('INCRBY', ['large', '2000000']);
    assert.strictEqual(result, 3000000);
  });

  it('should persist incremented value', () => {
    executeCommand('INCRBY', ['a', '5']);
    executeCommand('INCRBY', ['a', '3']);
    const result = executeCommand('INCRBY', ['a', '2']);
    assert.strictEqual(result, 10);
  });

  it('should throw for non-numeric value', () => {
    executeCommand('SET', ['notanumber', 'hello']);
    assert.throws(() => {
      executeCommand('INCRBY', ['notanumber', '5']);
    }, RespError);
  });

  it('should throw for non-numeric increment', () => {
    executeCommand('SET', ['counter', '5']);
    assert.throws(() => {
      executeCommand('INCRBY', ['counter', 'notanumber']);
    }, RespError);
  });

  it('should throw when increment is missing', () => {
    executeCommand('SET', ['counter', '5']);
    assert.throws(() => {
      executeCommand('INCRBY', ['counter']);
    }, RespError);
  });

  it('should throw when key is missing', () => {
    assert.throws(() => {
      executeCommand('INCRBY', []);
    }, RespError);
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['num', '42']);
    const result = executeCommand('INCRBY', ['num', '8']);
    assert.strictEqual(result, 50);
  });

  it('should handle multiple increments correctly', () => {
    const r1 = executeCommand('INCRBY', ['counter', '5']);
    assert.strictEqual(r1, 5);
    const r2 = executeCommand('INCRBY', ['counter', '10']);
    assert.strictEqual(r2, 15);
    const r3 = executeCommand('INCRBY', ['counter', '-3']);
    assert.strictEqual(r3, 12);
  });

  it('should store result as string', () => {
    executeCommand('INCRBY', ['z', '100']);
    const result = executeCommand('GET', ['z']);
    assert.strictEqual(result, '100');
  });
});
