import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { executeCommand, setupStore } from './test-utils.js';

describe('Unknown command', () => {
  it('should return unknown command message', () => {
    setupStore();
    const result = executeCommand('UNKNOWN', []);
    assert.strictEqual(result, 'Unknown command: UNKNOWN');
  });

  it('should handle various unknown commands', () => {
    setupStore();
    const commands = ['RANDOM', 'BADCMD', 'NOTAREALCMD', 'FOOBAR'];
    for (const cmd of commands) {
      const result = executeCommand(cmd, []);
      assert.strictEqual(result, `Unknown command: ${cmd}`);
    }
  });
});
