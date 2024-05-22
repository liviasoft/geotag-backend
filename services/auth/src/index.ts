import { app } from './app';
import http from 'http';
import { config } from './utils/config';
// import { writeClient } from './lib/influxdb';
// import { Point } from '@influxdata/influxdb-client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocketClient = require('websocket').client;
// import { getPocketBase, setPocketBase } from './lib/pocketbase';
// Functions below are to test db connections
// import { initGraphDriver } from './lib/memgraph';
// import { queryTestData, queryTestDataAggregate, writeTestData } from './lib/influxdb';
// import { readTestEvents, writeTestEvent } from './lib/eventstore';

const client = new WebSocketClient();

client.on('connectFailed', function (error: any) {
  console.log('Connect Error: ' + error?.toString());
});

client.on('connect', function (connection: any) {
  console.log('WebSocket Client Connected');
  connection.on('error', function (error: any) {
    console.log('Connection Error: ' + error.toString());
  });
  connection.on('close', function () {
    console.log('echo-protocol Connection Closed');
  });
  connection.on('message', async function (message: any) {
    if (message.type === 'utf8') {
      // console.log("Received: '" + message.utf8Data + "'");
      const data = JSON.parse(message.utf8Data);
      console.log({ data });
      // Object.keys(data).forEach((key) => {
      //   const point = new Point('arduino').tag('key', key).intField(key, data[key]);
      //   writeClient.writePoint(point);
      // });
      // await writeClient.flush();
    }
  });

  // function sendNumber() {
  //   if (connection.connected) {
  //     const number = Math.round(Math.random() * 0xffffff);
  //     connection.sendUTF(number.toString());
  //     setTimeout(sendNumber, 1000);
  //   }
  // }
  // sendNumber();
});

client.connect('ws://192.168.212.111:81/');

const httpServer = http.createServer(app);
const PORT = config.self.port;

httpServer.listen(PORT, async () => {
  // await setPocketBase(config.pocketbase.url as string);
  // const pb = getPocketBase();
  // const user = await pb.collection('users').getOne('y7609xw17niss2c');
  // console.log({ user });
  // await initGraphDriver()
  // await writeTestData()
  // await queryTestData()
  // await queryTestDataAggregate()
  // await writeTestEvent()
  // await readTestEvents()
  console.log(`API running on port ${PORT}`);
});
