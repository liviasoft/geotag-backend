import eventsource from 'eventsource';
import { app } from './app';
import http from 'http';
import { config } from './utils/config';
// import { getPocketBase, setPocketBase } from './lib/pocketbase';
import { getChannel, rabbitMQConnect, setChannel } from './lib/rabbitmq';
import { serviceEvents } from './events';
import { initReverseProxy } from './middleware/reverse-proxy';
import { setPocketBase } from './lib/pocketbase';
import { setIO } from './lib/socketio';
// import PBService from './modules/pocketbase/common.pb';
// import { setChannel } from "./lib/rabbitmq";
// import { User } from "./lib/pocketbase.types";
// import { ClientResponseError } from "@neoncoder/pocketbase";
// import { AppSetting } from './lib/pocketbase.types';
// Functions below are to test db connections
// import { initGraphDriver } from './lib/memgraph';
// import { queryTestData, queryTestDataAggregate, writeTestData } from './lib/influxdb';
// import { readTestEvents, writeTestEvent } from './lib/eventstore';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.EventSource = eventsource;

const {
  self,
  // rabbitMQ: { url, exchange, queue },
  // pocketbase,
} = config;

const httpServer = http.createServer(app);
const io = setIO(httpServer);
io.on('connection', (socket) => {
  console.log(`${self.name} service Socket Client is connected ${socket.id}`);
  socket.on('disconnect', async (reason) => {
    console.log('User disconnected', { reason });
  });
});
const PORT = self.port;

// const myMap = new Map();
// myMap.set(404, ({ message = "Not found" }) => ({ code: 404, message, status: "NOT_FOUND" }));

httpServer.listen(PORT, async () => {
  // await setChannel(url as string, queue as string, exchange as string);
  await setPocketBase();
  // const pb = getPocketBase();
  // await pb.collection('users').subscribe(
  //   'jzd4ar37o0m2gkn',
  //   (data) => {
  //     console.log({ data });
  //   },
  //   {},
  // );
  // console.log({ result: result() });
  // const userPBService = new PBService('users');
  // await userPBService.subscribeToCollection({ options: { keepalive: true } });
  // const pb = getPocketBase();
  // let user: User;
  // try {
  //   user = await pb.collection("users").getOne("y7609xw17niss2cd", { expand: "roles" });
  //   console.log({ user });
  // } catch (error: any) {
  //   if (error instanceof ClientResponseError) {
  //     const result = myMap.get(error.status)!({});
  //     console.log({ result });
  //   }
  //   console.log(error instanceof ClientResponseError);
  //   console.log({ error });
  // }
  // const appSetting: Pick<AppSetting, 'name'> = {
  //   // name: 'TestSetting',
  //   // type: 'string',
  //   name: 'TestSetting',
  //   type: '',
  // };
  // console.log({ appSetting });
  // const newUser = await pb.collection('users').create({});
  // await initGraphDriver()
  // await writeTestData()
  // await queryTestData()
  // await queryTestDataAggregate()
  // await writeTestEvent()
  // await readTestEvents()
  await initReverseProxy(app);
  const channel = await rabbitMQConnect(config.rabbitMQ);
  if (channel) setChannel(channel);
  await serviceEvents(getChannel());
  console.log(`${self.name} API running on port ${PORT}`);
});
