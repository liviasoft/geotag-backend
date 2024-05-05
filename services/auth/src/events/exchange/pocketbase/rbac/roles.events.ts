import { eventTypes } from '../common';

const ROLE_UPDATED = async (data: any) => {
  console.log({ data });
};

const ROLE_DELETED = async (data: any) => {
  console.log({ data });
};

const roleEventHandlers = {
  [eventTypes.CREATED]: ROLE_UPDATED,
  [eventTypes.UPDATED]: ROLE_UPDATED,
  [eventTypes.DELETED]: ROLE_DELETED,
};

export const ROLE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await roleEventHandlers[data.action](data);
  }
};
