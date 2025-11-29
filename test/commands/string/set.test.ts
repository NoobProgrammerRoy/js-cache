import * as assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { RespError } from '../../../src/error.js';
import { clearStore, executeCommand, setupStore } from '../../test-utils.js';

describe('SET command', () => {
  before(() => {
    setupStore();
  });

  beforeEach(() => {
    clearStore();
  });

  it('should set a key-value pair', () => {
    const result = executeCommand('SET', ['mykey', 'myvalue']);
    assert.strictEqual(result, 'OK');
  });

  it('should overwrite existing key', () => {
    executeCommand('SET', ['key', 'value1']);
    executeCommand('SET', ['key', 'value2']);
    const getResult = executeCommand('GET', ['key']);
    assert.strictEqual(getResult, 'value2');
  });

  it('should handle numeric string values', () => {
    const result = executeCommand('SET', ['numkey', '42']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['numkey']);
    assert.strictEqual(getValue, '42');
  });

  it('should set key with NX when key does not exist', () => {
    const result = executeCommand('SET', ['newkey', 'value', 'NX']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['newkey']);
    assert.strictEqual(getValue, 'value');
  });

  it('should return null with NX when key already exists', () => {
    executeCommand('SET', ['existingkey', 'value1']);
    const result = executeCommand('SET', ['existingkey', 'value2', 'NX']);
    assert.strictEqual(result, null);
    const getValue = executeCommand('GET', ['existingkey']);
    assert.strictEqual(getValue, 'value1');
  });

  it('should set key with XX when key already exists', () => {
    executeCommand('SET', ['existingkey', 'oldvalue']);
    const result = executeCommand('SET', ['existingkey', 'newvalue', 'XX']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['existingkey']);
    assert.strictEqual(getValue, 'newvalue');
  });

  it('should return null with XX when key does not exist', () => {
    const result = executeCommand('SET', ['newkey', 'value', 'XX']);
    assert.strictEqual(result, null);
    const getValue = executeCommand('GET', ['newkey']);
    assert.strictEqual(getValue, null);
  });

  // Multiple NX/XX operations in sequence
  it('should handle multiple NX operations correctly', () => {
    const result1 = executeCommand('SET', ['key1', 'value1', 'NX']);
    const result2 = executeCommand('SET', ['key1', 'value2', 'NX']);
    const result3 = executeCommand('SET', ['key2', 'value3', 'NX']);

    assert.strictEqual(result1, 'OK');
    assert.strictEqual(result2, null);
    assert.strictEqual(result3, 'OK');

    assert.strictEqual(executeCommand('GET', ['key1']), 'value1');
    assert.strictEqual(executeCommand('GET', ['key2']), 'value3');
  });

  it('should handle multiple XX operations correctly', () => {
    executeCommand('SET', ['key1', 'value1']);
    const result1 = executeCommand('SET', ['key1', 'newvalue1', 'XX']);
    const result2 = executeCommand('SET', ['key2', 'value2', 'XX']);

    assert.strictEqual(result1, 'OK');
    assert.strictEqual(result2, null);

    assert.strictEqual(executeCommand('GET', ['key1']), 'newvalue1');
    assert.strictEqual(executeCommand('GET', ['key2']), null);
  });

  it('should throw error when both NX and XX are specified', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'NX', 'XX']),
      RespError
    );
  });

  it('should throw error for invalid flag', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'INVALID']),
      RespError
    );
  });

  it('should work with NX after DEL', () => {
    executeCommand('SET', ['key', 'value']);
    executeCommand('DEL', ['key']);
    const result = executeCommand('SET', ['key', 'newvalue', 'NX']);
    assert.strictEqual(result, 'OK');
    assert.strictEqual(executeCommand('GET', ['key']), 'newvalue');
  });

  it('should work with empty string values and NX', () => {
    const result = executeCommand('SET', ['emptykey', '', 'NX']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['emptykey']);
    assert.strictEqual(getValue, '');
  });

  it('should work with empty string values and XX', () => {
    executeCommand('SET', ['key', 'value']);
    const result = executeCommand('SET', ['key', '', 'XX']);
    assert.strictEqual(result, 'OK');
    const getValue = executeCommand('GET', ['key']);
    assert.strictEqual(getValue, '');
  });

  it('should set expiration with EX flag in seconds', () => {
    const result = executeCommand('SET', ['mykey', 'value', 'EX', '10']);
    assert.strictEqual(result, 'OK');
    const ttl = executeCommand('TTL', ['mykey']) as number;
    assert.ok(ttl > 0 && ttl <= 10);
  });

  it('should set expiration with PX flag in milliseconds', () => {
    const result = executeCommand('SET', ['mykey', 'value', 'PX', '5000']);
    assert.strictEqual(result, 'OK');
    const pttl = executeCommand('PTTL', ['mykey']) as number;
    assert.ok(pttl > 0 && pttl <= 5000);
  });

  it('should throw error when EX flag has no value', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'EX']),
      RespError
    );
  });

  it('should throw error when PX flag has no value', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'PX']),
      RespError
    );
  });

  it('should throw error when EX value is not a positive integer', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'EX', '0']),
      RespError
    );
  });

  it('should throw error when PX value is not a positive integer', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'PX', '-100']),
      RespError
    );
  });

  it('should throw error when both EX and PX are specified', () => {
    assert.throws(
      () => executeCommand('SET', ['key', 'value', 'EX', '10', 'PX', '5000']),
      RespError
    );
  });

  it('should work with EX and NX flags together', () => {
    const result = executeCommand('SET', ['mykey', 'value', 'NX', 'EX', '10']);
    assert.strictEqual(result, 'OK');
    const ttl = executeCommand('TTL', ['mykey']) as number;
    assert.ok(ttl > 0 && ttl <= 10);
  });

  it('should work with PX and XX flags together', () => {
    executeCommand('SET', ['mykey', 'oldvalue']);
    const result = executeCommand('SET', [
      'mykey',
      'value',
      'XX',
      'PX',
      '5000',
    ]);
    assert.strictEqual(result, 'OK');
    const pttl = executeCommand('PTTL', ['mykey']) as number;
    assert.ok(pttl > 0 && pttl <= 5000);
  });

  it('should expire key after EX seconds', (t, done) => {
    executeCommand('SET', ['mykey', 'value', 'EX', '1']);
    assert.strictEqual(executeCommand('GET', ['mykey']), 'value');

    setTimeout(() => {
      assert.strictEqual(executeCommand('GET', ['mykey']), null);
      done();
    }, 1100);
  });

  it('should expire key after PX milliseconds', (t, done) => {
    executeCommand('SET', ['mykey', 'value', 'PX', '500']);
    assert.strictEqual(executeCommand('GET', ['mykey']), 'value');

    setTimeout(() => {
      assert.strictEqual(executeCommand('GET', ['mykey']), null);
      done();
    }, 600);
  });
});
