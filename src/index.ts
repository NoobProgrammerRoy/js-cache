import * as net from 'net';
import AOF from './aof.js';
import { RespError } from './error.js';
import MapStore from './map-store.js';
import { getResponseFromOperation } from './operator.js';
import RespParser from './resp-parser.js';
import { TRespType, TWriteOperation } from './types.js';

const PORT = process.env.PORT ?? 6379;
const AOF_ENABLED = process.env.AOF_ENABLED === 'true';
const AOF_FILENAME = process.env.AOF_FILENAME ?? 'appendonly.aof';

const store = new MapStore();
const aof = new AOF({ filename: AOF_FILENAME, isEnabled: AOF_ENABLED });

async function replayAOFCommands(aof: AOF) {
  const commands = await aof.load();

  for (const command of commands) {
    const [operation, ...args] = command as string[];

    try {
      getResponseFromOperation(store, operation, args);
    } catch (err) {
      console.error(`Failed to replay AOF command ${operation}:`, err);
    }
  }

  return commands.length;
}

async function initializeAOF(aof: AOF) {
  console.log(`📂 Loading AOF from ${AOF_FILENAME}`);
  const count = await replayAOFCommands(aof);
  console.log(`✅ AOF loaded with ${count} commands`);
}

async function persistToAOF(operation: TWriteOperation, args: string[]) {
  if (operation === 'FLUSHALL') await aof.append(operation);
  else if (operation === 'SET') await aof.append(operation, ...args);
  else if (operation === 'DEL') await aof.append(operation, ...args);
  else if (operation === 'INCR' || operation === 'DECR')
    await aof.append(operation, args[0]);
}

async function executeAndPersist(operation: string, args: string[]) {
  const response = getResponseFromOperation(store, operation, args);

  await persistToAOF(operation as TWriteOperation, args);

  return response;
}

function createDataHandler(socket: net.Socket) {
  let buffer = '';

  return async (data: Buffer) => {
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

        response = await executeAndPersist(operation, args);
      }

      socket.write(RespParser.serialize(response));
    } catch (err) {
      console.error('Error processing command:', err);

      const errorResponse =
        err instanceof RespError ? err : new RespError((err as Error).message);

      socket.write(RespParser.serialize(errorResponse));
    }
  };
}

function attachSocketHandlers(socket: net.Socket) {
  const dataHandler = createDataHandler(socket);

  socket.on('data', dataHandler);
  socket.on('end', () => {
    console.log('✅ Client disconnected');
  });
  socket.on('error', (err) => {
    console.error('❌ Socket error:', err);
  });
}

function createServer() {
  const server = net.createServer((socket) => {
    attachSocketHandlers(socket);
  });

  return server;
}

function setupGracefulShutdown(server: net.Server) {
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
}

async function start() {
  await initializeAOF(aof);

  const server = createServer();

  server.listen(PORT, () => {
    console.log(`TCP Server listening on port ${PORT}`);
  });

  setupGracefulShutdown(server);
}

start().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
