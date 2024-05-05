import { app } from './app';
import http from 'http';
import { config } from './utils/config';
import { setPocketBase, getPocketBase } from './lib/pocketbase';
import { setChannel } from './lib/rabbitmq';
// Functions below are to test db connections
// import { initGraphDriver } from './lib/memgraph';
// import { queryTestData, queryTestDataAggregate, writeTestData } from './lib/influxdb';
// import { readTestEvents, writeTestEvent } from './lib/eventstore';

const {
  self,
  rabbitMQ: { url, exchange, queue },
  pocketbase,
} = config;

const httpServer = http.createServer(app);
const PORT = self.port;

httpServer.listen(PORT, async () => {
  await setChannel(url as string, queue as string, exchange as string);
  await setPocketBase(pocketbase.url as string);
  const pb = getPocketBase();
  const user = await pb.collection('users').getOne('y7609xw17niss2c');
  user.created;
  console.log({ user });
  // await initGraphDriver()
  // await writeTestData()
  // await queryTestData()
  // await queryTestDataAggregate()
  // await writeTestEvent()
  // await readTestEvents()
  console.log(`API running on port ${PORT}`);
});
