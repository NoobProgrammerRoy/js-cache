import { RespError } from './error.js';
import { TRespType } from './types.js';

class RespParser {
  static deserialize(data: string): TRespType {
    const { value } = this.parseValue(data, 0);
    return value;
  }

  static parseValue(
    data: string,
    position: number
  ): { value: TRespType; nextPosition: number } {
    const type = data[position];
    position++; // Move past type character

    // Find the end of the line (CRLF)
    const crlfIndex = data.indexOf('\r\n', position);

    if (crlfIndex === -1) {
      throw new Error('Invalid RESP format: missing CRLF');
    }

    const line = data.substring(position, crlfIndex);
    let nextPosition = crlfIndex + 2; // Move past CRLF

    switch (type) {
      case '+': // Simple string
        return { value: line, nextPosition };
      case '-': // Error
        return { value: line, nextPosition };
      case ':': // Integer
        return { value: parseInt(line, 10), nextPosition };
      case '$': // Bulk string
        const length = parseInt(line, 10);

        if (length === -1) return { value: null, nextPosition };
        if (length < 0) {
          throw new Error(`Invalid bulk string length: ${length}`);
        }

        const bulkData = data.substring(nextPosition, nextPosition + length);

        if (bulkData.length !== length) {
          throw new Error(
            `Bulk string length mismatch: expected ${length}, got ${bulkData.length}`
          );
        }

        nextPosition += length;

        // Consume the trailing CRLF after bulk string
        if (data.substring(nextPosition, nextPosition + 2) !== '\r\n') {
          throw new Error(
            'Invalid RESP format: missing CRLF after bulk string'
          );
        }

        nextPosition += 2;
        return { value: bulkData, nextPosition };
      case '*': // Array
        const count = parseInt(line, 10);

        if (count === -1) return { value: null, nextPosition };
        if (count < 0) {
          throw new Error(`Invalid array count: ${count}`);
        }

        const array: TRespType[] = [];

        for (let i = 0; i < count; i++) {
          const { value, nextPosition: newPosition } = this.parseValue(
            data,
            nextPosition
          );
          array.push(value);
          nextPosition = newPosition;
        }

        return { value: array, nextPosition };
      default:
        throw new Error(`Unknown RESP type: ${type}`);
    }
  }

  // Serializer: JavaScript types to RESP
  static serialize(value: TRespType): string {
    if (value instanceof RespError) {
      return `-ERR ${value.message}\r\n`;
    }
    if (typeof value === 'string') {
      return `$${value.length}\r\n${value}\r\n`;
    }
    if (typeof value === 'number') {
      return `:${value}\r\n`;
    }
    if (typeof value === 'boolean') {
      return `:${value ? 1 : 0}\r\n`;
    }
    if (value === null) {
      return '$-1\r\n';
    }
    if (Array.isArray(value)) {
      let result = `*${value.length}\r\n`;

      for (const item of value) {
        result += this.serialize(item);
      }

      return result;
    }

    throw new Error(`Cannot serialize type: ${typeof value}`);
  }
}

export default RespParser;
