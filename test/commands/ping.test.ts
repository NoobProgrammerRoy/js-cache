import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('PING command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should return PONG with no arguments', () => {
    const result = executeCommand('PING', []);
    assert.strictEqual(result, 'PONG');
  });

  it('should echo arguments with space separation', () => {
    const result = executeCommand('PING', ['hello', 'world']);
    assert.strictEqual(result, 'hello world');
  });

  it('should echo single argument', () => {
    const result = executeCommand('PING', ['hello']);
    assert.strictEqual(result, 'hello');
  });

  it('should handle multiple arguments', () => {
    const result = executeCommand('PING', ['a', 'b', 'c', 'd']);
    assert.strictEqual(result, 'a b c d');
  });
});
