import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { RespError } from '../../src/error.js';
import { executeCommand, setupStore } from './test-utils.js';

describe('ECHO command', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should echo a simple string', () => {
    const result = executeCommand('ECHO', ['Hello']);
    assert.strictEqual(result, 'Hello');
  });

  it('should echo a message with spaces', () => {
    const result = executeCommand('ECHO', ['Hello World']);
    assert.strictEqual(result, 'Hello World');
  });

  it('should echo a message with punctuation', () => {
    const result = executeCommand('ECHO', ['Hello, World!']);
    assert.strictEqual(result, 'Hello, World!');
  });

  it('should echo an empty string', () => {
    const result = executeCommand('ECHO', ['']);
    assert.strictEqual(result, '');
  });

  it('should echo numeric string', () => {
    const result = executeCommand('ECHO', ['123456']);
    assert.strictEqual(result, '123456');
  });

  it('should echo string with special characters', () => {
    const result = executeCommand('ECHO', ['!@#$%^&*()']);
    assert.strictEqual(result, '!@#$%^&*()');
  });

  it('should echo string with newlines', () => {
    const result = executeCommand('ECHO', ['line1\nline2\nline3']);
    assert.strictEqual(result, 'line1\nline2\nline3');
  });

  it('should echo string with tabs', () => {
    const result = executeCommand('ECHO', ['col1\tcol2\tcol3']);
    assert.strictEqual(result, 'col1\tcol2\tcol3');
  });

  it('should echo unicode characters', () => {
    const result = executeCommand('ECHO', ['Hello 世界']);
    assert.strictEqual(result, 'Hello 世界');
  });

  it('should echo emoji characters', () => {
    const result = executeCommand('ECHO', ['🎉🎊🎈']);
    assert.strictEqual(result, '🎉🎊🎈');
  });

  it('should echo string with quotes', () => {
    const result = executeCommand('ECHO', ['"quoted"']);
    assert.strictEqual(result, '"quoted"');
  });

  it('should echo very long string', () => {
    const longString = 'a'.repeat(10000);
    const result = executeCommand('ECHO', [longString]);
    assert.strictEqual(result, longString);
  });

  it('should echo string with backslashes', () => {
    const result = executeCommand('ECHO', ['path\\to\\file']);
    assert.strictEqual(result, 'path\\to\\file');
  });

  it('should echo string with single quotes', () => {
    const result = executeCommand('ECHO', ["it's working"]);
    assert.strictEqual(result, "it's working");
  });

  it('should echo string with mixed case', () => {
    const result = executeCommand('ECHO', ['HeLLo WoRLd']);
    assert.strictEqual(result, 'HeLLo WoRLd');
  });

  it('should throw when no arguments provided', () => {
    assert.throws(
      () => executeCommand('ECHO', []),
      (err) => err instanceof RespError
    );
  });

  it('should throw when too many arguments provided', () => {
    assert.throws(
      () => executeCommand('ECHO', ['first', 'second']),
      (err) => err instanceof RespError
    );
  });

  it('should echo string with leading/trailing spaces', () => {
    const result = executeCommand('ECHO', ['  spaced  ']);
    assert.strictEqual(result, '  spaced  ');
  });
});
