import { eventTypes } from '../common';

const RESOURCE_UPDATED = async (data: any) => {
  console.log({ data });
};

const RESOURCE_DELETED = async (data: any) => {
  console.log({ data });
};

const resourceEventHandlers = {
  [eventTypes.CREATED]: RESOURCE_UPDATED,
  [eventTypes.UPDATED]: RESOURCE_UPDATED,
  [eventTypes.DELETED]: RESOURCE_DELETED,
};

export const RESOURCE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await resourceEventHandlers[data.action](data);
  }
};
