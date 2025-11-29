import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('KEYS command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should return all keys matching * pattern', () => {
    executeCommand('SET', ['firstname', 'Jack']);
    executeCommand('SET', ['lastname', 'Stuntman']);
    executeCommand('SET', ['age', '35']);

    const result = executeCommand('KEYS', ['*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 3);
    assert.ok(result.includes('firstname'));
    assert.ok(result.includes('lastname'));
    assert.ok(result.includes('age'));
  });

  it('should return keys matching *name* pattern', () => {
    executeCommand('SET', ['firstname', 'Jack']);
    executeCommand('SET', ['lastname', 'Stuntman']);
    executeCommand('SET', ['age', '35']);

    const result = executeCommand('KEYS', ['*name*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('firstname'));
    assert.ok(result.includes('lastname'));
    assert.ok(!result.includes('age'));
  });

  it('should return keys matching a?? pattern (single char wildcard)', () => {
    executeCommand('SET', ['age', '35']);
    executeCommand('SET', ['any', 'value']);
    executeCommand('SET', ['ab', 'value']);

    const result = executeCommand('KEYS', ['a??']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('age'));
    assert.ok(result.includes('any'));
    assert.ok(!result.includes('ab'));
  });

  it('should return keys matching h[ae]llo pattern (character class)', () => {
    executeCommand('SET', ['hello', '1']);
    executeCommand('SET', ['hallo', '2']);
    executeCommand('SET', ['hillo', '3']);

    const result = executeCommand('KEYS', ['h[ae]llo']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('hello'));
    assert.ok(result.includes('hallo'));
    assert.ok(!result.includes('hillo'));
  });

  it('should return keys matching h[^e]llo pattern (negated character class)', () => {
    executeCommand('SET', ['hello', '1']);
    executeCommand('SET', ['hallo', '2']);
    executeCommand('SET', ['hbllo', '3']);

    const result = executeCommand('KEYS', ['h[^e]llo']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('hallo'));
    assert.ok(result.includes('hbllo'));
    assert.ok(!result.includes('hello'));
  });

  it('should return keys matching h[a-b]llo pattern (range in character class)', () => {
    executeCommand('SET', ['hallo', '1']);
    executeCommand('SET', ['hbllo', '2']);
    executeCommand('SET', ['hcllo', '3']);

    const result = executeCommand('KEYS', ['h[a-b]llo']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('hallo'));
    assert.ok(result.includes('hbllo'));
    assert.ok(!result.includes('hcllo'));
  });

  it('should return empty array when no keys match pattern', () => {
    executeCommand('SET', ['key1', 'value']);
    executeCommand('SET', ['key2', 'value']);

    const result = executeCommand('KEYS', ['nonexistent*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0);
  });

  it('should return empty array when store is empty', () => {
    const result = executeCommand('KEYS', ['*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0);
  });

  it('should handle escaped special characters with backslash', () => {
    executeCommand('SET', ['key[1]', 'value1']);
    executeCommand('SET', ['key[2]', 'value2']);
    executeCommand('SET', ['keyX1Y', 'value3']);

    const result = executeCommand('KEYS', ['key\\[1\\]']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
    assert.ok(result.includes('key[1]'));
  });

  it('should match keys with h*llo pattern', () => {
    executeCommand('SET', ['hllo', '1']);
    executeCommand('SET', ['heeeello', '2']);
    executeCommand('SET', ['hallo', '3']);

    const result = executeCommand('KEYS', ['h*llo']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 3);
  });

  it('should match single character with ? pattern', () => {
    executeCommand('SET', ['a', 'value']);
    executeCommand('SET', ['b', 'value']);
    executeCommand('SET', ['abc', 'value']);

    const result = executeCommand('KEYS', ['?']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('a'));
    assert.ok(result.includes('b'));
  });

  it('should handle multiple patterns in sequence', () => {
    executeCommand('SET', ['user:1', 'John']);
    executeCommand('SET', ['user:2', 'Jane']);
    executeCommand('SET', ['post:1', 'Hello']);

    const result1 = executeCommand('KEYS', ['user:*']) as string[];
    assert.strictEqual(result1.length, 2);

    const result2 = executeCommand('KEYS', ['post:*']) as string[];
    assert.strictEqual(result2.length, 1);

    const result3 = executeCommand('KEYS', ['*:*']) as string[];
    assert.strictEqual(result3.length, 3);
  });

  it('should be case-sensitive', () => {
    executeCommand('SET', ['Key', 'value1']);
    executeCommand('SET', ['key', 'value2']);
    executeCommand('SET', ['KEY', 'value3']);

    const result1 = executeCommand('KEYS', ['Key']) as string[];
    assert.strictEqual(result1.length, 1);
    assert.ok(result1.includes('Key'));

    const result2 = executeCommand('KEYS', ['key']) as string[];
    assert.strictEqual(result2.length, 1);
    assert.ok(result2.includes('key'));
  });

  it('should work with list keys', () => {
    executeCommand('LPUSH', ['list:1', 'value']);
    executeCommand('LPUSH', ['list:2', 'value']);
    executeCommand('SET', ['string:1', 'value']);

    const result = executeCommand('KEYS', ['list:*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('list:1'));
    assert.ok(result.includes('list:2'));
  });

  it('should work with set keys', () => {
    executeCommand('SADD', ['set:1', 'member']);
    executeCommand('SADD', ['set:2', 'member']);
    executeCommand('SET', ['string:1', 'value']);

    const result = executeCommand('KEYS', ['set:*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('set:1'));
    assert.ok(result.includes('set:2'));
  });

  it('should throw error when pattern argument is missing', () => {
    assert.throws(
      () => executeCommand('KEYS', []),
      (err: Error) => err.message.includes('wrong number of arguments')
    );
  });

  it('should throw error when too many arguments provided', () => {
    assert.throws(
      () => executeCommand('KEYS', ['pattern', 'extra']),
      (err: Error) => err.message.includes('wrong number of arguments')
    );
  });

  it('should match keys with numeric prefixes', () => {
    executeCommand('SET', ['1key', 'value']);
    executeCommand('SET', ['2key', 'value']);
    executeCommand('SET', ['key1', 'value']);

    const result = executeCommand('KEYS', ['?key']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('1key'));
    assert.ok(result.includes('2key'));
  });

  it('should handle complex patterns correctly', () => {
    executeCommand('SET', ['app:config:db', 'value']);
    executeCommand('SET', ['app:config:cache', 'value']);
    executeCommand('SET', ['app:data:users', 'value']);
    executeCommand('SET', ['other:config', 'value']);

    const result = executeCommand('KEYS', ['app:*:*']);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 3);
  });
});
