import * as net from 'net';
import AOF from './aof.js';
import { RespError } from './error.js';
import MapStore from './map-store.js';
import RespParser from './resp-parser.js';
import { IAOFConfig, TRespType } from './types.js';
import { getNumberFromString } from './util.js';

const PORT = process.env.PORT ?? 6379;

const config = {
  filename: process.env.AOF_FILENAME ?? 'appendonly.aof',
  isEnabled: process.env.AOF_ENABLED === 'true',
} satisfies IAOFConfig;

const store = new MapStore<string, TRespType>();
const aof = new AOF(config);

async function initAOF(config: IAOFConfig) {
  console.log(`📂 Loading AOF from ${config.filename}`);
  const commands = await aof.load();

  for (const command of commands) {
    const [operation, ...args] = command as string[];

    try {
      switch (operation.toUpperCase()) {
        case 'SET':
          if (args.length === 2) store.set(args[0], args[1]);
          break;
        case 'DEL':
          args.forEach((key) => store.delete(key));
          break;
        case 'INCR':
          if (args.length === 1) {
            const key = args[0];
            const currentValue = store.get(key);
            const newValue =
              currentValue === undefined ? 1 : Number(currentValue) + 1;

            store.set(key, newValue.toString());
          }
          break;
        case 'DECR':
          if (args.length === 1) {
            const key = args[0];
            const currentValue = store.get(key);
            const newValue =
              currentValue === undefined ? -1 : Number(currentValue) - 1;

            store.set(key, newValue.toString());
          }
          break;
        case 'FLUSHALL':
          store.clear();
          break;
      }
    } catch (err) {
      console.error(`Failed to replay AOF command ${operation}:`, err);
    }
  }

  console.log(`✅ AOF loaded with ${commands.length} commands`);
}

export function getResponseFromOperation(operation: string, args: string[]) {
  let response: TRespType | null = null;

  switch (operation) {
    case 'SET':
      if (args.length === 2) {
        store.set(args[0], args[1]);
        response = 'OK';
      }

      break;
    case 'GET':
      if (args.length === 1) response = store.get(args[0]) ?? null;
      break;
    case 'GETDEL':
      if (args.length === 1) {
        const key = args[0];
        const value = store.get(key);

        if (value === undefined) {
          response = null;
        } else if (typeof value === 'string') {
          response = value;
          store.delete(key);
        } else {
          throw new RespError(
            'GETDEL only works on string values, not ' + typeof value
          );
        }
      } else {
        throw new RespError('ERR wrong number of arguments for GETDEL command');
      }

      break;
    case 'DEL':
      if (args.length >= 1) {
        response = args.filter((key) => store.delete(key)).length;
      }

      break;
    case 'EXISTS':
      if (args.length >= 1)
        response = args.filter((key) => store.has(key)).length;

      break;
    case 'FLUSHALL':
      store.clear();
      response = 'OK';
      break;
    case 'PING':
      if (args.length === 0) {
        response = 'PONG';
        break;
      }

      response = args.reduce(
        (acc, curr, idx) => acc + (idx > 0 ? ' ' : '') + curr,
        ''
      );

      break;
    case 'INCR':
      if (args.length === 1) {
        const key = args[0];
        const currentValue = store.get(key);
        let newValue: number;

        if (currentValue === undefined) {
          newValue = 1;
        } else if (
          typeof currentValue === 'string' &&
          getNumberFromString(currentValue) !== undefined
        ) {
          newValue = Number(currentValue) + 1;
        } else {
          throw new RespError('value is not an integer or out of range');
        }

        store.set(key, newValue.toString());
        response = newValue;
      }

      break;
    case 'DECR':
      if (args.length === 1) {
        const key = args[0];
        const currentValue = store.get(key);
        let newValue: number;

        if (currentValue === undefined) {
          newValue = -1;
        } else if (
          typeof currentValue === 'string' &&
          getNumberFromString(currentValue) !== undefined
        ) {
          newValue = Number(currentValue) - 1;
        } else {
          throw new RespError('value is not an integer or out of range');
        }

        store.set(key, newValue.toString());
        response = newValue;
      }

      break;
    default:
      response = `Unknown command: ${operation}`;
  }

  return response;
}

function createServer(config: IAOFConfig) {
  const server = net.createServer((socket) => {
    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();
      let response: TRespType | null = null;

      try {
        const command = RespParser.deserialize(buffer);
        console.log('Received command:', command);

        // Clear buffer after successful parse
        buffer = '';

        if (Array.isArray(command)) {
          const [cmd, ...args] = command as string[];
          const operation = cmd.toUpperCase();

          response = getResponseFromOperation(operation, args);

          switch (operation) {
            case 'SET':
              await aof.append(operation, ...args);
              break;
            case 'DEL':
              await aof.append(operation, ...args);
              break;
            case 'FLUSHALL':
              await aof.append(operation);
              break;
            case 'INCR':
              await aof.append(operation, args[0]);
              break;
            case 'DECR':
              await aof.append(operation, args[0]);
              break;
          }
        }

        socket.write(RespParser.serialize(response));
      } catch (err) {
        console.error('Error processing command:', err);
        const errorResponse =
          err instanceof RespError
            ? err
            : new RespError((err as Error).message);
        socket.write(RespParser.serialize(errorResponse));
      }
    });

    socket.on('end', () => {
      console.log('✅ Client disconnected');
    });

    socket.on('error', (err) => {
      console.error('❌ Socket error:', err);
    });
  });

  return server;
}

async function init(config: IAOFConfig) {
  await initAOF(config);

  return createServer(config);
}

// Only run server if this is the main module
if (
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))
) {
  init(config)
    .then((server) => {
      server.listen(PORT, () => {
        console.log(`TCP Server listening on port ${PORT}`);
      });

      function shutdown(signal: string) {
        console.log(`📋 ${signal} received. Starting graceful shutdown`);

        server.close(() => {
          console.log('✅ Server closed. No new connections accepted.');
          process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          console.error('⚠️ Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      }

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        shutdown('uncaughtException');
      });
      process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        shutdown('unhandledRejection');
      });
    })
    .catch((err) => {
      console.error('Failed to initialize server:', err);
      process.exit(1);
    });
}
