import * as fs from 'fs/promises';
import * as assert from 'node:assert';
import { afterEach, before, describe, it } from 'node:test';
import * as path from 'path';
import AOF from '../src/aof.js';

const TEST_AOF_FILE = path.join(process.cwd(), 'test-aof.txt');

describe('AOF (Append-Only File)', () => {
  before(async () => {
    // Clean up any existing test AOF file
    try {
      await fs.unlink(TEST_AOF_FILE);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test AOF file after each test
    try {
      await fs.unlink(TEST_AOF_FILE);
    } catch {
      // File might not exist, that's fine
    }
  });

  describe('AOF constructor and configuration', () => {
    it('should create AOF instance with enabled configuration', () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      assert.ok(aof);
    });

    it('should create AOF instance with disabled configuration', () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: false });
      assert.ok(aof);
    });
  });

  describe('AOF.append() - Writing commands', () => {
    it('should append a SET command to file', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'mykey', 'myvalue');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('SET'));
      assert.ok(fileContent.includes('mykey'));
      assert.ok(fileContent.includes('myvalue'));
    });

    it('should append a DEL command to file', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('DEL', 'key1', 'key2');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('DEL'));
      assert.ok(fileContent.includes('key1'));
      assert.ok(fileContent.includes('key2'));
    });

    it('should append multiple commands sequentially', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key1', 'value1');
      await aof.append('SET', 'key2', 'value2');
      await aof.append('DEL', 'key1');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      const lines = fileContent.split('\n').filter((line) => line.trim());
      assert.ok(lines.length >= 3);
    });

    it('should not append command when AOF is disabled', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: false });
      await aof.append('SET', 'mykey', 'myvalue');

      try {
        await fs.access(TEST_AOF_FILE);
        assert.fail('File should not exist when AOF is disabled');
      } catch {
        // Expected: file should not exist
      }
    });

    it('should append LPUSH command with multiple values', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('LPUSH', 'mylist', 'a', 'b', 'c');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('LPUSH'));
      assert.ok(fileContent.includes('mylist'));
      assert.ok(fileContent.includes('a'));
      assert.ok(fileContent.includes('b'));
      assert.ok(fileContent.includes('c'));
    });

    it('should append SADD command with multiple members', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SADD', 'myset', 'member1', 'member2', 'member3');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('SADD'));
      assert.ok(fileContent.includes('myset'));
      assert.ok(fileContent.includes('member1'));
    });

    it('should append EXPIRE command with key and seconds', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('EXPIRE', 'mykey', '3600');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('EXPIRE'));
      assert.ok(fileContent.includes('mykey'));
      assert.ok(fileContent.includes('3600'));
    });

    it('should append FLUSHALL command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('FLUSHALL');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('FLUSHALL'));
    });

    it('should serialize commands in RESP format', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key', 'value');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      // RESP format starts with *
      assert.ok(fileContent.startsWith('*'));
    });

    it('should handle special characters in values', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      const specialValue = 'value with\nspecial\rcharacters';
      await aof.append('SET', 'key', specialValue);

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      // Should be properly serialized
      assert.ok(fileContent.length > 0);
    });

    it('should handle empty string values', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'emptykey', '');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('emptykey'));
    });

    it('should handle numeric string values', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'numkey', '12345');

      const fileContent = await fs.readFile(TEST_AOF_FILE, 'utf-8');
      assert.ok(fileContent.includes('12345'));
    });
  });

  describe('AOF.load() - Reading commands', () => {
    it('should load empty list when file does not exist', async () => {
      const aof = new AOF({
        filename: 'nonexistent-aof-file.txt',
        isEnabled: true,
      });
      const commands = await aof.load();
      assert.deepStrictEqual(commands, []);
    });

    it('should load empty list when AOF is disabled', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: false });
      const commands = await aof.load();
      assert.deepStrictEqual(commands, []);
    });

    it('should load empty list from empty file', async () => {
      await fs.writeFile(TEST_AOF_FILE, '');
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      const commands = await aof.load();
      assert.deepStrictEqual(commands, []);
    });

    it('should load single SET command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key', 'value');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['SET', 'key', 'value']);
    });

    it('should load multiple commands in order', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key1', 'value1');
      await aof.append('SET', 'key2', 'value2');
      await aof.append('DEL', 'key1');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 3);
      assert.deepStrictEqual(commands[0], ['SET', 'key1', 'value1']);
      assert.deepStrictEqual(commands[1], ['SET', 'key2', 'value2']);
      assert.deepStrictEqual(commands[2], ['DEL', 'key1']);
    });

    it('should load LPUSH command with multiple values', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('LPUSH', 'mylist', 'a', 'b', 'c');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['LPUSH', 'mylist', 'a', 'b', 'c']);
    });

    it('should load SADD command with multiple members', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SADD', 'myset', 'member1', 'member2');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], [
        'SADD',
        'myset',
        'member1',
        'member2',
      ]);
    });

    it('should load EXPIRE command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('EXPIRE', 'mykey', '3600');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['EXPIRE', 'mykey', '3600']);
    });

    it('should load FLUSHALL command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('FLUSHALL');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['FLUSHALL']);
    });

    it('should handle values with special characters on load', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      const specialValue = 'value with\nspecial\rcharacters';
      await aof.append('SET', 'key', specialValue);

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.strictEqual(commands[0][2], specialValue);
    });

    it('should handle empty string values on load', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'emptykey', '');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.strictEqual(commands[0][2], '');
    });

    it('should handle numeric string values on load', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'numkey', '12345');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.strictEqual(commands[0][2], '12345');
    });

    it('should ignore trailing whitespace in file', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key', 'value');

      // Add trailing whitespace
      await fs.appendFile(TEST_AOF_FILE, '\n\n\r\n');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['SET', 'key', 'value']);
    });
  });

  describe('AOF append/load round-trip', () => {
    it('should round-trip SET and GET operations', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key1', 'value1');
      await aof.append('SET', 'key2', 'value2');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 2);
      assert.deepStrictEqual(commands[0], ['SET', 'key1', 'value1']);
      assert.deepStrictEqual(commands[1], ['SET', 'key2', 'value2']);
    });

    it('should round-trip complex sequence of operations', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'mykey', 'myvalue');
      await aof.append('LPUSH', 'mylist', 'item1', 'item2');
      await aof.append('SADD', 'myset', 'member1', 'member2');
      await aof.append('EXPIRE', 'mykey', '3600');
      await aof.append('DEL', 'oldkey');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 5);
      assert.deepStrictEqual(commands[0], ['SET', 'mykey', 'myvalue']);
      assert.deepStrictEqual(commands[1], [
        'LPUSH',
        'mylist',
        'item1',
        'item2',
      ]);
      assert.deepStrictEqual(commands[2], [
        'SADD',
        'myset',
        'member1',
        'member2',
      ]);
      assert.deepStrictEqual(commands[3], ['EXPIRE', 'mykey', '3600']);
      assert.deepStrictEqual(commands[4], ['DEL', 'oldkey']);
    });

    it('should preserve command types and arguments on round-trip', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      const originalCommands = [
        ['SET', 'key', 'value'],
        ['DEL', 'key1', 'key2', 'key3'],
        ['EXPIRE', 'mykey', '1000'],
      ];

      for (const [cmd, ...args] of originalCommands) {
        await aof.append(cmd as any, ...args);
      }

      const loadedCommands = await aof.load();
      assert.deepStrictEqual(loadedCommands, originalCommands);
    });
  });

  describe('AOF error handling', () => {
    it('should handle gracefully when load fails with invalid data', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      // Write invalid RESP data
      await fs.writeFile(TEST_AOF_FILE, 'invalid resp data');

      // Load should not throw, but return empty or partial results
      const commands = await aof.load();
      assert.ok(Array.isArray(commands));
    });

    it('should continue appending after successful write', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SET', 'key1', 'value1');
      await aof.append('SET', 'key2', 'value2');
      await aof.append('SET', 'key3', 'value3');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 3);
    });
  });

  describe('AOF concurrent operations', () => {
    it('should handle concurrent appends correctly', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });

      // Simulate concurrent appends
      await Promise.all([
        aof.append('SET', 'key1', 'value1'),
        aof.append('SET', 'key2', 'value2'),
        aof.append('SET', 'key3', 'value3'),
      ]);

      const commands = await aof.load();
      assert.strictEqual(commands.length, 3);
    });
  });

  describe('AOF with various write operations', () => {
    it('should handle MSET command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('MSET', 'key1', 'value1', 'key2', 'value2');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], [
        'MSET',
        'key1',
        'value1',
        'key2',
        'value2',
      ]);
    });

    it('should handle APPEND command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('APPEND', 'key', 'value');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['APPEND', 'key', 'value']);
    });

    it('should handle SETRANGE command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('SETRANGE', 'key', '5', 'value');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['SETRANGE', 'key', '5', 'value']);
    });

    it('should handle LSET command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('LSET', 'mylist', '0', 'newvalue');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['LSET', 'mylist', '0', 'newvalue']);
    });

    it('should handle LTRIM command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('LTRIM', 'mylist', '0', '10');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['LTRIM', 'mylist', '0', '10']);
    });

    it('should handle RENAME command', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('RENAME', 'oldkey', 'newkey');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 1);
      assert.deepStrictEqual(commands[0], ['RENAME', 'oldkey', 'newkey']);
    });

    it('should handle all expiration commands', async () => {
      const aof = new AOF({ filename: TEST_AOF_FILE, isEnabled: true });
      await aof.append('EXPIRE', 'key1', '10');
      await aof.append('PEXPIRE', 'key2', '10000');
      await aof.append('EXPIREAT', 'key3', '1700000000');
      await aof.append('PEXPIREAT', 'key4', '1700000000000');
      await aof.append('PERSIST', 'key5');

      const commands = await aof.load();
      assert.strictEqual(commands.length, 5);
      assert.deepStrictEqual(commands[0], ['EXPIRE', 'key1', '10']);
      assert.deepStrictEqual(commands[1], ['PEXPIRE', 'key2', '10000']);
      assert.deepStrictEqual(commands[2], ['EXPIREAT', 'key3', '1700000000']);
      assert.deepStrictEqual(commands[3], [
        'PEXPIREAT',
        'key4',
        '1700000000000',
      ]);
      assert.deepStrictEqual(commands[4], ['PERSIST', 'key5']);
    });
  });
});
