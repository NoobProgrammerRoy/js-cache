import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { RespError } from '../src/error.js';
import { getResponseFromOperation } from '../src/index.js';

describe('Command Execution', () => {
  describe('SET command', () => {
    it('should set a key-value pair', () => {
      const result = getResponseFromOperation('SET', ['mykey', 'myvalue']);
      assert.strictEqual(result, 'OK');
    });

    it('should overwrite existing key', () => {
      getResponseFromOperation('SET', ['key', 'value1']);
      getResponseFromOperation('SET', ['key', 'value2']);
      const getResult = getResponseFromOperation('GET', ['key']);
      assert.strictEqual(getResult, 'value2');
    });
  });

  describe('GET command', () => {
    it('should get an existing value', () => {
      getResponseFromOperation('SET', ['key', 'value']);
      const result = getResponseFromOperation('GET', ['key']);
      assert.strictEqual(result, 'value');
    });

    it('should return null for non-existent key', () => {
      const result = getResponseFromOperation('GET', ['nonexistent']);
      assert.strictEqual(result, null);
    });
  });

  describe('DEL command', () => {
    it('should delete a key and return 1', () => {
      getResponseFromOperation('SET', ['key', 'value']);
      const result = getResponseFromOperation('DEL', ['key']);
      assert.strictEqual(result, 1);
      const getResult = getResponseFromOperation('GET', ['key']);
      assert.strictEqual(getResult, null);
    });

    it('should delete multiple keys', () => {
      getResponseFromOperation('SET', ['key1', 'value1']);
      getResponseFromOperation('SET', ['key2', 'value2']);
      const result = getResponseFromOperation('DEL', ['key1', 'key2']);
      assert.strictEqual(result, 2);
    });

    it('should return 0 for non-existent keys', () => {
      const result = getResponseFromOperation('DEL', ['nonexistent']);
      assert.strictEqual(result, 0);
    });
  });

  describe('EXISTS command', () => {
    it('should return count of existing keys', () => {
      getResponseFromOperation('SET', ['key1', 'value1']);
      getResponseFromOperation('SET', ['key2', 'value2']);
      const result = getResponseFromOperation('EXISTS', [
        'key1',
        'key2',
        'nonexistent',
      ]);
      assert.strictEqual(result, 2);
    });

    it('should return 0 when no keys exist', () => {
      const result = getResponseFromOperation('EXISTS', ['nonexistent']);
      assert.strictEqual(result, 0);
    });
  });

  describe('FLUSHALL command', () => {
    it('should clear all keys', () => {
      getResponseFromOperation('SET', ['key1', 'value1']);
      getResponseFromOperation('SET', ['key2', 'value2']);
      const result = getResponseFromOperation('FLUSHALL', []);
      assert.strictEqual(result, 'OK');
      const getResult1 = getResponseFromOperation('GET', ['key1']);
      const getResult2 = getResponseFromOperation('GET', ['key2']);
      assert.strictEqual(getResult1, null);
      assert.strictEqual(getResult2, null);
    });
  });

  describe('PING command', () => {
    it('should return PONG with no arguments', () => {
      const result = getResponseFromOperation('PING', []);
      assert.strictEqual(result, 'PONG');
    });

    it('should echo arguments with space separation', () => {
      const result = getResponseFromOperation('PING', ['hello', 'world']);
      assert.strictEqual(result, 'hello world');
    });
  });

  describe('INCR command', () => {
    it('should increment existing numeric value', () => {
      getResponseFromOperation('SET', ['counter', '5']);
      const result = getResponseFromOperation('INCR', ['counter']);
      assert.strictEqual(result, 6);
      const getResult = getResponseFromOperation('GET', ['counter']);
      assert.strictEqual(getResult, '6');
    });

    it('should start at 1 for non-existent key', () => {
      const result = getResponseFromOperation('INCR', ['newcounter']);
      assert.strictEqual(result, 1);
    });

    it('should throw for non-numeric value', () => {
      getResponseFromOperation('SET', ['notanumber', 'hello']);
      assert.throws(() => {
        getResponseFromOperation('INCR', ['notanumber']);
      }, RespError);
    });

    it('should increment from 0', () => {
      getResponseFromOperation('SET', ['zero', '0']);
      const result = getResponseFromOperation('INCR', ['zero']);
      assert.strictEqual(result, 1);
    });

    it('should handle negative numbers', () => {
      getResponseFromOperation('SET', ['negative', '-5']);
      const result = getResponseFromOperation('INCR', ['negative']);
      assert.strictEqual(result, -4);
    });
  });

  describe('DECR command', () => {
    it('should decrement existing numeric value', () => {
      getResponseFromOperation('SET', ['counter', '5']);
      const result = getResponseFromOperation('DECR', ['counter']);
      assert.strictEqual(result, 4);
      const getResult = getResponseFromOperation('GET', ['counter']);
      assert.strictEqual(getResult, '4');
    });

    it('should start at -1 for non-existent key', () => {
      const result = getResponseFromOperation('DECR', ['newdecr']);
      assert.strictEqual(result, -1);
    });

    it('should throw for non-numeric value', () => {
      getResponseFromOperation('SET', ['notanumber', 'hello']);
      assert.throws(() => {
        getResponseFromOperation('DECR', ['notanumber']);
      }, RespError);
    });

    it('should decrement from 0', () => {
      getResponseFromOperation('SET', ['zero', '0']);
      const result = getResponseFromOperation('DECR', ['zero']);
      assert.strictEqual(result, -1);
    });

    it('should handle negative numbers', () => {
      getResponseFromOperation('SET', ['negative', '-5']);
      const result = getResponseFromOperation('DECR', ['negative']);
      assert.strictEqual(result, -6);
    });
  });

  describe('Unknown command', () => {
    it('should return unknown command message', () => {
      const result = getResponseFromOperation('UNKNOWN', []);
      assert.strictEqual(result, 'Unknown command: UNKNOWN');
    });
  });
});
