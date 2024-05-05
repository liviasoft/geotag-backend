import { eventTypes } from '../common';

const SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  console.log({ data });
};

const SPECIAL_PERMISSION_DELETED = async (data: any) => {
  console.log({ data });
};

const specialPermissionEventHandlers = {
  [eventTypes.CREATED]: SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: SPECIAL_PERMISSION_DELETED,
};

export const SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await specialPermissionEventHandlers[data.action](data);
  }
};
