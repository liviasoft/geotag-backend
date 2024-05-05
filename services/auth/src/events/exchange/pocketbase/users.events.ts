import { eventTypes } from './common';

const USER_UPDATED = async (data: any) => {
  console.log({ data });
};

const USER_DELETED = async (data: any) => {
  console.log({ data });
};

const userEventHandlers = {
  [eventTypes.CREATED]: USER_UPDATED,
  [eventTypes.UPDATED]: USER_UPDATED,
  [eventTypes.DELETED]: USER_DELETED,
};

export const USER_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userEventHandlers[data.action](data);
  }
};
