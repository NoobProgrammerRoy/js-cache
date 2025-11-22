import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SREM command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return 0 when removing from non-existent key', () => {
    const result = executeCommand('SREM', ['nonexistent', 'member']);
    assert.strictEqual(result, 0);
  });

  it('should remove single member from set', () => {
    executeCommand('SADD', ['myset', 'Hello', 'World']);
    const result = executeCommand('SREM', ['myset', 'Hello']);
    assert.strictEqual(result, 1);
    const members = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.deepStrictEqual(members, ['World']);
  });

  it('should remove multiple members in one command', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c', 'd', 'e']);
    const result = executeCommand('SREM', ['myset', 'a', 'c', 'e']);
    assert.strictEqual(result, 3);
    const members = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.strictEqual(members.length, 2);
    assert.ok(members.includes('b'));
    assert.ok(members.includes('d'));
  });

  it('should return 0 when removing non-existent members', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    const result = executeCommand('SREM', ['myset', 'x', 'y', 'z']);
    assert.strictEqual(result, 0);
    const members = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.strictEqual(members.length, 3);
  });

  it('should count only removed members when removing mixed existing and non-existing', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    const result = executeCommand('SREM', ['myset', 'a', 'x', 'b', 'y']);
    assert.strictEqual(result, 2);
    const members = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.deepStrictEqual(members, ['c']);
  });

  it('should delete key when set becomes empty', () => {
    executeCommand('SADD', ['myset', 'only']);
    executeCommand('SREM', ['myset', 'only']);
    const scard = executeCommand('SCARD', ['myset']);
    assert.strictEqual(scard, 0);
  });

  it('should delete key after removing all members', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    executeCommand('SREM', ['myset', 'a', 'b', 'c']);
    const exists = executeCommand('EXISTS', ['myset']);
    assert.strictEqual(exists, 0);
  });

  it('should handle removing from set with single member', () => {
    executeCommand('SADD', ['myset', 'Hello']);
    const result = executeCommand('SREM', ['myset', 'Hello']);
    assert.strictEqual(result, 1);
    const scard = executeCommand('SCARD', ['myset']);
    assert.strictEqual(scard, 0);
  });

  it('should handle numeric string members', () => {
    executeCommand('SADD', ['myset', '1', '2', '3']);
    const result = executeCommand('SREM', ['myset', '1', '3']);
    assert.strictEqual(result, 2);
    const members = executeCommand('SMEMBERS', ['myset']) as string[];
    assert.deepStrictEqual(members, ['2']);
  });

  it('should work correctly after multiple SREM operations', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c', 'd', 'e']);
    assert.strictEqual(executeCommand('SREM', ['myset', 'a', 'b']), 2);
    assert.strictEqual(executeCommand('SREM', ['myset', 'c']), 1);
    assert.strictEqual(executeCommand('SREM', ['myset', 'd', 'e']), 2);
    const scard = executeCommand('SCARD', ['myset']);
    assert.strictEqual(scard, 0);
  });

  it('should throw error when key holds string value', () => {
    executeCommand('SET', ['mykey', 'string_value']);
    assert.throws(() => executeCommand('SREM', ['mykey', 'member']), RespError);
  });

  it('should throw error when key holds number value', () => {
    executeCommand('SET', ['mykey', '42']);
    assert.throws(() => executeCommand('SREM', ['mykey', 'member']), RespError);
  });

  it('should throw error when key holds list value', () => {
    executeCommand('LPUSH', ['mykey', 'element']);
    assert.throws(() => executeCommand('SREM', ['mykey', 'member']), RespError);
  });

  it('should throw error when wrong number of arguments (no members)', () => {
    assert.throws(() => executeCommand('SREM', ['myset']), RespError);
  });

  it('should throw error when no arguments', () => {
    assert.throws(() => executeCommand('SREM', []), RespError);
  });

  it('should work correctly after RENAME command', () => {
    executeCommand('SADD', ['oldset', 'a', 'b', 'c']);
    executeCommand('RENAME', ['oldset', 'newset']);
    const result = executeCommand('SREM', ['newset', 'a', 'b']);
    assert.strictEqual(result, 2);
    const members = executeCommand('SMEMBERS', ['newset']) as string[];
    assert.deepStrictEqual(members, ['c']);
  });
});
