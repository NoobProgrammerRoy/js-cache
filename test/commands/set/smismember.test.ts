import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SMISMEMBER command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return array of membership results for multiple members', () => {
    executeCommand('SADD', ['myset', 'a', 'b', 'c']);
    const result = executeCommand('SMISMEMBER', [
      'myset',
      'a',
      'b',
      'x',
    ]) as number[];
    assert.deepStrictEqual(result, [1, 1, 0]);
  });

  it('should return 0 for all members in non-existent key', () => {
    const result = executeCommand('SMISMEMBER', [
      'nonexistent',
      'a',
      'b',
      'c',
    ]) as number[];
    assert.deepStrictEqual(result, [0, 0, 0]);
  });

  it('should handle single member check', () => {
    executeCommand('SADD', ['myset', 'one']);
    const result = executeCommand('SMISMEMBER', ['myset', 'one']) as number[];
    assert.deepStrictEqual(result, [1]);
  });

  it('should be case-sensitive for members', () => {
    executeCommand('SADD', ['myset', 'Hello', 'hello']);
    const result = executeCommand('SMISMEMBER', [
      'myset',
      'Hello',
      'hello',
      'HELLO',
    ]) as number[];
    assert.deepStrictEqual(result, [1, 1, 0]);
  });

  it('should reflect changes after SADD and SREM', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    let result = executeCommand('SMISMEMBER', ['myset', 'a', 'b']) as number[];
    assert.deepStrictEqual(result, [1, 1]);
    executeCommand('SREM', ['myset', 'a']);
    result = executeCommand('SMISMEMBER', ['myset', 'a', 'b']) as number[];
    assert.deepStrictEqual(result, [0, 1]);
  });

  it('should work independently across multiple sets', () => {
    executeCommand('SADD', ['set1', 'a', 'b']);
    executeCommand('SADD', ['set2', 'x', 'y']);
    const result1 = executeCommand('SMISMEMBER', [
      'set1',
      'a',
      'b',
      'x',
    ]) as number[];
    const result2 = executeCommand('SMISMEMBER', [
      'set2',
      'x',
      'y',
      'a',
    ]) as number[];
    assert.deepStrictEqual(result1, [1, 1, 0]);
    assert.deepStrictEqual(result2, [1, 1, 0]);
  });

  it('should throw WRONGTYPE error for non-set keys', () => {
    executeCommand('SET', ['strkey', 'value']);
    executeCommand('LPUSH', ['listkey', 'item']);
    assert.throws(
      () => executeCommand('SMISMEMBER', ['strkey', 'a', 'b']),
      RespError
    );
    assert.throws(
      () => executeCommand('SMISMEMBER', ['listkey', 'a', 'b']),
      RespError
    );
  });

  it('should throw error when no members provided', () => {
    executeCommand('SADD', ['myset', 'a']);
    assert.throws(() => executeCommand('SMISMEMBER', ['myset']), RespError);
    assert.throws(() => executeCommand('SMISMEMBER', []), RespError);
  });

  it('should handle duplicate checks in request', () => {
    executeCommand('SADD', ['myset', 'a', 'b']);
    const result = executeCommand('SMISMEMBER', [
      'myset',
      'a',
      'a',
      'b',
      'b',
      'x',
      'x',
    ]) as number[];
    assert.deepStrictEqual(result, [1, 1, 1, 1, 0, 0]);
  });

  it('should work after RENAME command', () => {
    executeCommand('SADD', ['oldset', 'a', 'b', 'c']);
    executeCommand('RENAME', ['oldset', 'newset']);
    const result = executeCommand('SMISMEMBER', [
      'newset',
      'a',
      'b',
      'c',
      'x',
    ]) as number[];
    assert.deepStrictEqual(result, [1, 1, 1, 0]);
  });
});
