import * as fs from 'fs/promises';
import { RespError } from './error.js';
import RespParser from './resp-parser.js';
import { IAOF, IAOFConfig, TRespType, TWriteOperation } from './types.js';

class AOF implements IAOF {
  private config: IAOFConfig;

  constructor(config: IAOFConfig) {
    this.config = config;
  }

  async append(operation: TWriteOperation, ...args: TRespType[]) {
    if (!this.config.isEnabled) return;

    try {
      const command = [operation, ...args];
      const serializedCommand = RespParser.serialize(command);

      await fs.appendFile(this.config.filename, serializedCommand);
    } catch (err) {
      console.error(
        `Failed to append to AOF file ${this.config.filename}:`,
        err
      );

      throw new RespError('Background save failed');
    }
  }

  async load() {
    if (!this.config.isEnabled) return [];

    try {
      await fs.access(this.config.filename);
    } catch {
      return [];
    }

    try {
      const data = await fs.readFile(this.config.filename, 'utf-8');

      if (!data.trim()) return [];

      const commands: TRespType[][] = [];
      let position = 0;

      // Parse each RESP command sequentially
      while (position < data.length) {
        const { value, nextPosition } = RespParser.parseValue(data, position);

        if (Array.isArray(value)) {
          commands.push(value);
        }

        position = nextPosition;

        // Skip any trailing whitespace/newlines
        while (
          position < data.length &&
          (data[position] === '\r' || data[position] === '\n')
        )
          position++;
      }

      return commands;
    } catch (err) {
      console.error(`Failed to load AOF file ${this.config.filename}:`, err);

      return [];
    }
  }
}

export default AOF;
