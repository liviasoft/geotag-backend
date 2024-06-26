import { POCKETBASE_EVENTS } from './pocketbase.events';

const exchangeEventOrigins = {
  POCKETBASE: 'POCKETBASE',
};

export const exchangeEventHandlers = {
  [exchangeEventOrigins.POCKETBASE]: POCKETBASE_EVENTS,
};
