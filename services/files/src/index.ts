// import eventsource from 'eventsource';
import http from 'http';
import { app } from './app';
import { config } from './config/config';
import { getChannel, rabbitMQConnect, setChannel } from './lib/rabbitmq';
import { serviceEvents } from './events';
import { setIO } from './lib/socketio';
import { serviceUP, startCronJob } from './lib/redis';
import { setPocketBase } from './lib/pocketbase';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-expect-error
// global.EventSource = eventsource;

const { self } = config;

const httpServer = http.createServer(app);
const io = setIO(httpServer);
io.on('connection', (socket) => {
  console.log(`${self.name} service Socket Client is connected ${socket.id}`);
  socket.on('disconnect', async (reason) => {
    console.log('User disconnected', { reason });
  });
  socket.on('LOCATION_CONNECTED', async ({ locationId }) => {
    console.log(`connected location: ${locationId}`);
    await socket.join(locationId);
  });
  socket.on('LOCATION_DISCONNECTED', async ({ locationId }) => {
    console.log(`disconnecting from location: ${locationId}`);
    await socket.leave(locationId);
  });
});
const PORT = self.port;

httpServer.listen(PORT, async () => {
  await setPocketBase();
  await serviceUP();
  const channel = await rabbitMQConnect(config.rabbitMQ);
  if (channel) setChannel(channel);
  await serviceEvents(getChannel());
  // console.log(typeof startCronJob);
  startCronJob();
  console.log(`${self.name} API running on port ${PORT}`);
});
