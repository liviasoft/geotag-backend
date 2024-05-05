import { eventTypes } from '../common';

const SCOPE_UPDATED = async (data: any) => {
  console.log({ data });
};

const SCOPE_DELETED = async (data: any) => {
  console.log({ data });
};

const scopeEventHandlers = {
  [eventTypes.CREATED]: SCOPE_UPDATED,
  [eventTypes.UPDATED]: SCOPE_UPDATED,
  [eventTypes.DELETED]: SCOPE_DELETED,
};

export const SCOPE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await scopeEventHandlers[data.action](data);
  }
};
