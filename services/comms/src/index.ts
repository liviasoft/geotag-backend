import http from 'http';
import { app } from './app';
import { config } from './utils/config';
import { rabbitMQConnect, setChannel, getChannel } from './lib/rabbitmq';
import { serviceEvents } from './events';
import { setIO } from './lib/socketio';
import { serviceUP } from './lib/redis';
import { setPocketBase } from './lib/pocketbase';

const { self } = config;

const httpServer = http.createServer(app);
const io = setIO(httpServer);
io.on('connection', (socket) => {
  console.log(`${self.name} service Socket Client is connected ${socket.id}`);
  socket.on('disconnect', async (reason) => {
    console.log('Client disconnected', { reason });
  });
});
const PORT = self.port;

httpServer.listen(PORT, async () => {
  await serviceUP();
  await setPocketBase();
  const channel = await rabbitMQConnect(config.rabbitMQ);
  if (channel) setChannel(channel);
  await serviceEvents(getChannel());
  console.log(`${self.name} API running on port ${PORT}`);
});
