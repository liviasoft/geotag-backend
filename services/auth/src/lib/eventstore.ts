import {
  EventStoreDBClient,
  FORWARDS,
  JSONEventType,
  // NO_STREAM,
  START,
  STREAM_EXISTS,
  jsonEvent,
} from '@eventstore/db-client';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';

const { uri } = config.eventStore;

const client = EventStoreDBClient.connectionString`${uri as string}`;

type TestEvent = JSONEventType<
  'TestEvent',
  {
    entityId: string;
    importantData: string;
  }
>;

const event = jsonEvent<TestEvent>({
  type: 'TestEvent',
  data: {
    entityId: uuidv4(),
    importantData: "I'm writing another event!",
  },
});

export const writeTestEvent = async () => {
  await client.appendToStream('test-stream', event, {
    // expectedRevision: NO_STREAM - Use no stream if is first time stream
    expectedRevision: STREAM_EXISTS,
  });
};

export const readTestEvents = async () => {
  const events = client.readStream('test-stream', {
    direction: FORWARDS,
    fromRevision: START,
    maxCount: 10,
  });
  for await (const resolvedEvent of events) {
    console.log({ resolvedEvent });
    console.log({ event: resolvedEvent.event });
    console.log(resolvedEvent.event?.data);
  }
};
