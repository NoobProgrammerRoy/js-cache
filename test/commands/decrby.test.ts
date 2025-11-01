import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('DECRBY command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should decrement existing numeric value by given amount', () => {
    executeCommand('SET', ['counter', '10']);
    const result = executeCommand('DECRBY', ['counter', '3']);
    assert.strictEqual(result, 7);
    const getResult = executeCommand('GET', ['counter']);
    assert.strictEqual(getResult, '7');
  });

  it('should start at 0 and decrement for non-existent key', () => {
    const result = executeCommand('DECRBY', ['newcounter', '10']);
    assert.strictEqual(result, -10);
  });

  it('should decrement by 1 when decrement is 1', () => {
    executeCommand('SET', ['x', '5']);
    const result = executeCommand('DECRBY', ['x', '1']);
    assert.strictEqual(result, 4);
  });

  it('should decrement by 0 (no-op)', () => {
    executeCommand('SET', ['y', '5']);
    const result = executeCommand('DECRBY', ['y', '0']);
    assert.strictEqual(result, 5);
  });

  it('should handle negative decrements (increment effect)', () => {
    executeCommand('SET', ['counter', '10']);
    const result = executeCommand('DECRBY', ['counter', '-3']);
    assert.strictEqual(result, 13);
  });

  it('should handle negative starting values', () => {
    executeCommand('SET', ['neg', '-5']);
    const result = executeCommand('DECRBY', ['neg', '3']);
    assert.strictEqual(result, -8);
  });

  it('should handle large decrements', () => {
    executeCommand('SET', ['large', '3000000']);
    const result = executeCommand('DECRBY', ['large', '2000000']);
    assert.strictEqual(result, 1000000);
  });

  it('should persist decremented value', () => {
    executeCommand('DECRBY', ['a', '5']);
    executeCommand('DECRBY', ['a', '3']);
    const result = executeCommand('DECRBY', ['a', '2']);
    assert.strictEqual(result, -10);
  });

  it('should throw for non-numeric value', () => {
    executeCommand('SET', ['notanumber', 'hello']);
    assert.throws(() => {
      executeCommand('DECRBY', ['notanumber', '5']);
    }, RespError);
  });

  it('should throw for non-numeric decrement', () => {
    executeCommand('SET', ['counter', '5']);
    assert.throws(() => {
      executeCommand('DECRBY', ['counter', 'notanumber']);
    }, RespError);
  });

  it('should throw when decrement is missing', () => {
    executeCommand('SET', ['counter', '5']);
    assert.throws(() => {
      executeCommand('DECRBY', ['counter']);
    }, RespError);
  });

  it('should throw when key is missing', () => {
    assert.throws(() => {
      executeCommand('DECRBY', []);
    }, RespError);
  });

  it('should work with numeric string values', () => {
    executeCommand('SET', ['num', '50']);
    const result = executeCommand('DECRBY', ['num', '8']);
    assert.strictEqual(result, 42);
  });

  it('should handle multiple decrements correctly', () => {
    const r1 = executeCommand('DECRBY', ['counter', '5']);
    assert.strictEqual(r1, -5);
    const r2 = executeCommand('DECRBY', ['counter', '10']);
    assert.strictEqual(r2, -15);
    const r3 = executeCommand('DECRBY', ['counter', '-3']);
    assert.strictEqual(r3, -12);
  });

  it('should store result as string', () => {
    executeCommand('DECRBY', ['z', '100']);
    const result = executeCommand('GET', ['z']);
    assert.strictEqual(result, '-100');
  });
});
