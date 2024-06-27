import eventsource from 'eventsource';
import http from 'http';
import { app } from './app';
import { config } from './utils/config';
import { getChannel, rabbitMQConnect, setChannel } from './lib/rabbitmq';
import { serviceEvents } from './events';
import { setIO } from './lib/socketio';
import { serviceUP } from './lib/redis';
import { initReverseProxy } from './middleware/reverse-proxy';
import { setPocketBase } from './lib/pocketbase';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.EventSource = eventsource;

const { self } = config;

const httpServer = http.createServer(app);
const io = setIO(httpServer);
io.on('connection', (socket) => {
  console.log(`${self.name} service Socket Client is connected ${socket.id}`);
  socket.on('disconnect', async (reason) => {
    console.log('User disconnected', { reason });
  });
});
const PORT = self.port;

httpServer.listen(PORT, async () => {
  await setPocketBase();
  await initReverseProxy(app);
  await serviceUP();
  const channel = await rabbitMQConnect(config.rabbitMQ);
  if (channel) setChannel(channel);
  await serviceEvents(getChannel());
  console.log(`${self.name} API running on port ${PORT}`);
});
