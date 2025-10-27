import * as net from 'net';
import AOF from './aof.js';
import MapStore from './map.js';
import RespParser from './resp-parser.js';
import { TRespType } from './types.js';

const PORT = process.env.PORT ?? 6379;
const AOF_ENABLED = process.env.AOF_ENABLED === 'true';
const AOF_FILENAME = process.env.AOF_FILENAME ?? 'appendonly.aof';

const store = new MapStore<string, TRespType>();
const aof = new AOF(AOF_FILENAME);

async function init() {
  if (AOF_ENABLED) {
    console.log(`📂 Loading AOF from ${AOF_FILENAME}`);
    const commands = await aof.load();

    for (const command of commands) {
      const [operation, ...args] = command as string[];

      try {
        switch (operation.toUpperCase()) {
          case 'SET':
            if (args.length === 2) {
              store.set(args[0], args[1]);
            }
            break;
          case 'DEL':
            args.forEach((key) => store.delete(key));
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

          switch (operation) {
            case 'SET':
              if (args.length === 2) {
                store.set(args[0], args[1]);
                response = 'OK';

                if (AOF_ENABLED) await aof.append(operation, ...args);
              }
              break;
            case 'GET':
              if (args.length === 1) {
                response = store.get(args[0]) ?? null;
              }
              break;
            case 'DEL':
              if (args.length >= 1) {
                response = args.filter((key) => store.delete(key)).length;
                if (AOF_ENABLED) await aof.append(operation, ...args);
              }
              break;
            case 'EXISTS':
              if (args.length >= 1) {
                response = args.filter((key) => store.has(key)).length;
              }
              break;
            case 'FLUSHALL':
              store.clear();
              response = 'OK';
              if (AOF_ENABLED) await aof.append(operation);
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
            default:
              response = `Unknown command: ${operation}`;
          }
        }

        socket.write(RespParser.serialize(response));
      } catch (err) {
        console.error('Error processing command:', err);
        socket.write(RespParser.serialize(`Error: ${(err as Error).message}`));
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

init()
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
