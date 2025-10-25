import * as fs from 'fs/promises';
import RespParser from './resp-parser.js';
import { IAOF, TRespType } from './types.js';

class AOF implements IAOF {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  async append(operation: string, ...args: string[]) {
    try {
      const command = [operation, ...args];
      const respFormatted = RespParser.serialize(command as TRespType[]);

      // Append to file with newline separator
      await fs.appendFile(this.filename, respFormatted);
    } catch (err) {
      console.error(`Failed to append to AOF file ${this.filename}:`, err);
    }
  }

  async load(): Promise<string[][]> {
    try {
      // Check if file exists
      try {
        await fs.access(this.filename);
      } catch {
        // File doesn't exist yet
        return [];
      }

      const data = await fs.readFile(this.filename, 'utf-8');
      if (!data.trim()) return [];

      const commands: string[][] = [];
      let position = 0;

      // Parse each RESP command sequentially
      while (position < data.length) {
        try {
          const { value, nextPosition } = RespParser.parseValue(data, position);

          if (Array.isArray(value)) {
            commands.push(value as string[]);
          }

          position = nextPosition;

          // Skip any trailing whitespace/newlines
          while (
            position < data.length &&
            (data[position] === '\r' || data[position] === '\n')
          ) {
            position++;
          }
        } catch (err) {
          console.warn(
            `Failed to parse AOF command at position ${position}:`,
            err
          );
          break;
        }
      }

      return commands;
    } catch (err) {
      console.error(`Failed to load AOF file ${this.filename}:`, err);
      return [];
    }
  }
}

export default AOF;
