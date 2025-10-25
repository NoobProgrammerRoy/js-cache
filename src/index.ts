import * as net from 'net';

const PORT = process.env.PORT ?? 6379;

const server = net.createServer((socket) => {
  console.log('✅ Client connected');

  socket.on('data', (data) => {
    console.log('Received:', data.toString());
    socket.write(`Echo: ${data}`);
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
