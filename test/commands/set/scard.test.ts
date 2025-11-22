import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SCARD command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return 0 for non-existent key', () => {
    const result = executeCommand('SCARD', ['nonexistent']);
    assert.strictEqual(result, 0);
  });

  it('should return 1 for set with single member', () => {
    executeCommand('SADD', ['myset', 'Hello']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 1);
  });

  it('should return 2 for set with two members', () => {
    executeCommand('SADD', ['myset', 'Hello', 'World']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 2);
  });

  it('should return correct count for set with multiple members', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c', 'd', 'e']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 5);
  });

  it('should return correct count for set with duplicates', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c', 'd', 'a', 'b']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 4);
  });

  it('should return updated count after multiple SADD operations', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 2);

    executeCommand('SADD', ['myset', 'c', 'd']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 4);

    executeCommand('SADD', ['myset', 'e']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 5);
  });

  it('should return updated count after multiple SADD operations with duplicates', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 2);

    executeCommand('SADD', ['myset', 'a', 'b']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 2);

    executeCommand('SADD', ['myset', 'c', 'd']);
    assert.strictEqual(executeCommand('SCARD', ['myset']), 4);
  });

  it('should return correct count with numeric string members', () => {
    executeCommand('SADD', ['myset', '1', '2', '3', '100']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 4);
  });

  it('should return 0 after DEL command', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    executeCommand('DEL', ['myset']);
    const result = executeCommand('SCARD', ['myset']);
    assert.strictEqual(result, 0);
  });

  it('should throw error when key holds string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('SCARD', ['mykey']), RespError);
  });

  it('should throw error when key holds number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('SCARD', ['mykey']), RespError);
  });

  it('should throw error when key holds list value', () => {
    executeCommand('LPUSH', ['mykey', 'element']);
    assert.throws(() => executeCommand('SCARD', ['mykey']), RespError);
  });

  it('should throw error when wrong number of arguments (no key)', () => {
    assert.throws(() => executeCommand('SCARD', []), RespError);
  });

  it('should throw error when too many arguments', () => {
    assert.throws(() => executeCommand('SCARD', ['myset', 'extra']), RespError);
  });

  it('should return correct count after RENAME command', () => {
    executeCommand('SADD', ['oldset', 'a', 'b', 'c']);
    executeCommand('RENAME', ['oldset', 'newset']);
    const result = executeCommand('SCARD', ['newset']);
    assert.strictEqual(result, 3);
  });
});
