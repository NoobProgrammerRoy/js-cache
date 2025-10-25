import * as net from 'net';
import MapStore from './map.js';
import RespParser from './resp-parser.js';
import { TRespType } from './types.js';

const PORT = process.env.PORT ?? 6379;
const store = new MapStore<string, TRespType>();

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    console.log('✅ Client connected');

    let response: TRespType | null = null;

    try {
      const command = RespParser.deserialize(data.toString());
      console.log('Received command:', command);

      if (Array.isArray(command)) {
        const [cmd, ...args] = command as string[];
        const operation = cmd.toUpperCase();

        switch (operation) {
          case 'SET':
            if (args.length === 2) {
              store.set(args[0], args[1]);
              response = 'OK';
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

server.listen(PORT, () => {
  console.log(`TCP Server listening on port ${PORT}`);
});
