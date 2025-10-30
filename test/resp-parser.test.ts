import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { RespError } from '../src/error.js';
import RespParser from '../src/resp-parser.js';

describe('RespParser - Deserialize', () => {
  it('should deserialize simple string', () => {
    const result = RespParser.deserialize('+OK\r\n');
    assert.strictEqual(result, 'OK');
  });

  it('should deserialize integer', () => {
    const result = RespParser.deserialize(':42\r\n');
    assert.strictEqual(result, 42);
  });

  it('should deserialize bulk string', () => {
    const result = RespParser.deserialize('$5\r\nhello\r\n');
    assert.strictEqual(result, 'hello');
  });

  it('should deserialize null bulk string', () => {
    const result = RespParser.deserialize('$-1\r\n');
    assert.strictEqual(result, null);
  });

  it('should deserialize array', () => {
    const result = RespParser.deserialize('*2\r\n$3\r\nSET\r\n$5\r\nhello\r\n');
    assert.deepStrictEqual(result, ['SET', 'hello']);
  });

  it('should deserialize nested array', () => {
    const result = RespParser.deserialize(
      '*2\r\n*2\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n'
    );
    assert.deepStrictEqual(result, [['SET', 'key'], 'value']);
  });

  it('should throw on missing CRLF', () => {
    assert.throws(
      () => {
        RespParser.deserialize('+OK');
      },
      (err: Error) => err.message.includes('missing CRLF')
    );
  });
});

describe('RespParser - Serialize', () => {
  it('should serialize string', () => {
    const result = RespParser.serialize('hello');
    assert.strictEqual(result, '$5\r\nhello\r\n');
  });

  it('should serialize integer', () => {
    const result = RespParser.serialize(42);
    assert.strictEqual(result, ':42\r\n');
  });

  it('should serialize boolean true', () => {
    const result = RespParser.serialize(true);
    assert.strictEqual(result, ':1\r\n');
  });

  it('should serialize boolean false', () => {
    const result = RespParser.serialize(false);
    assert.strictEqual(result, ':0\r\n');
  });

  it('should serialize null', () => {
    const result = RespParser.serialize(null);
    assert.strictEqual(result, '$-1\r\n');
  });

  it('should serialize array', () => {
    const result = RespParser.serialize(['SET', 'key', 'value']);
    assert.strictEqual(
      result,
      '*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n'
    );
  });

  it('should serialize RespError', () => {
    const error = new RespError('test error');
    const result = RespParser.serialize(error);
    assert.strictEqual(result, '-ERR test error\r\n');
  });
});

describe('RespParser - Round-trip', () => {
  it('should round-trip string', () => {
    const original = 'hello';
    const serialized = RespParser.serialize(original);
    const deserialized = RespParser.deserialize(serialized);
    assert.strictEqual(deserialized, original);
  });

  it('should round-trip integer', () => {
    const original = 123;
    const serialized = RespParser.serialize(original);
    const deserialized = RespParser.deserialize(serialized);
    assert.strictEqual(deserialized, original);
  });

  it('should round-trip array of strings', () => {
    const original = ['SET', 'mykey', 'myvalue'];
    const serialized = RespParser.serialize(original);
    const deserialized = RespParser.deserialize(serialized);
    assert.deepStrictEqual(deserialized, original);
  });
});
