import { app } from './app';
import http from 'http';
import { config } from './utils/config';
// Functions below are to test db connections
// import { initGraphDriver } from './lib/memgraph';
// import { queryTestData, queryTestDataAggregate, writeTestData } from './lib/influxdb';
// import { readTestEvents, writeTestEvent } from './lib/eventstore';

const httpServer = http.createServer(app);
const PORT = config.self.port;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

httpServer.listen(PORT, async () => {
  // await initGraphDriver()
  // await writeTestData()
  // await queryTestData()
  // await queryTestDataAggregate()
  // await writeTestEvent()
  // await readTestEvents()
  console.log(`API running on port ${PORT}`);
});
