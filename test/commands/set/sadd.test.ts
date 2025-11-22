import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SADD command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should add single member to empty set', () => {
    const result = executeCommand('SADD', ['myset', 'Hello']);
    assert.strictEqual(result, 1);
  });

  it('should add multiple members to empty set', () => {
    const result = executeCommand('SADD', ['myset', 'Hello', 'World']);
    assert.strictEqual(result, 2);
  });

  it('should add multiple members in one command and return count', () => {
    const result = executeCommand('SADD', ['myset', 'a', 'b', 'c', 'd', 'e']);
    assert.strictEqual(result, 5);
  });

  it('should ignore duplicate members', () => {
    executeCommand('SADD', ['myset', 'Hello', 'World']);
    const result = executeCommand('SADD', ['myset', 'World']);
    assert.strictEqual(result, 0);
  });

  it('should add new members while ignoring duplicates', () => {
    executeCommand('SADD', ['myset', 'Hello', 'World']);
    const result = executeCommand('SADD', ['myset', 'World', 'Foo', 'Bar']);
    assert.strictEqual(result, 2);
  });

  it('should handle numeric string members', () => {
    const result = executeCommand('SADD', ['myset', '1', '2', '3']);
    assert.strictEqual(result, 3);
  });

  it('should allow adding same member across different keys', () => {
    const result1 = executeCommand('SADD', ['set1', 'member']);
    const result2 = executeCommand('SADD', ['set2', 'member']);
    assert.strictEqual(result1, 1);
    assert.strictEqual(result2, 1);
  });

  it('should throw error when key holds string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('SADD', ['mykey', 'member']), RespError);
  });

  it('should throw error when key holds number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('SADD', ['mykey', 'member']), RespError);
  });

  it('should throw error when key holds list value', () => {
    executeCommand('LPUSH', ['mykey', 'element']);
    assert.throws(() => executeCommand('SADD', ['mykey', 'member']), RespError);
  });

  it('should throw error when wrong number of arguments', () => {
    assert.throws(() => executeCommand('SADD', ['myset']), RespError);
  });
});
