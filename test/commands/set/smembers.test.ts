import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SMEMBERS command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return empty array for non-existent key', () => {
    const result = executeCommand('SMEMBERS', ['nonexistent']);
    assert.deepStrictEqual(result, []);
  });

  it('should return single member from set', () => {
    executeCommand('SADD', ['myset', 'Hello']);
    const result = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.deepStrictEqual(result.sort(), ['Hello']);
  });

  it('should return multiple members from set', () => {
    executeCommand('SADD', ['myset', 'Hello', 'World']);
    const result = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('Hello'));
    assert.ok(result.includes('World'));
  });

  it('should return members after multiple SADD operations', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    executeCommand('SADD', ['myset', 'c', 'd']);
    executeCommand('SADD', ['myset', 'e']);
    const result = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.strictEqual(result.length, 5);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
    assert.ok(result.includes('d'));
    assert.ok(result.includes('e'));
  });

  it('should throw error when key holds string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('SMEMBERS', ['mykey']), RespError);
  });

  it('should throw error when key holds number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('SMEMBERS', ['mykey']), RespError);
  });

  it('should throw error when key holds list value', () => {
    executeCommand('LPUSH', ['mykey', 'element']);
    assert.throws(() => executeCommand('SMEMBERS', ['mykey']), RespError);
  });

  it('should throw error when wrong number of arguments', () => {
    assert.throws(() => executeCommand('SMEMBERS', []), RespError);
  });

  it('should throw error when too many arguments', () => {
    assert.throws(
      () => executeCommand('SMEMBERS', ['myset', 'extra']),
      RespError
    );
  });

  it('should work correctly with RENAME command', () => {
    executeCommand('SADD', ['oldset', 'a', 'b', 'c']);
    executeCommand('RENAME', ['oldset', 'newset']);
    const result = executeCommand('SMEMBERS', ['newset']) as string[];
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
    assert.ok(result.includes('c'));
  });
});
