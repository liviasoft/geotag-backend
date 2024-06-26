import { RECORDS_EVENTS } from './pocketbase/records.events';

const pocketbaseEventTypes = {
  RECORDS: 'RECORDS',
};

const pocketbaseEventHandlers = {
  [pocketbaseEventTypes.RECORDS]: RECORDS_EVENTS,
};

export const POCKETBASE_EVENTS = async (message: any) => {
  if (Object.keys(pocketbaseEventTypes).includes(message.type)) {
    await pocketbaseEventHandlers[message.type](message);
  }
};
