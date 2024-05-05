import { eventTypes } from '../common';

const USER_SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  console.log({ data });
};

const USER_SPECIAL_PERMISSION_DELETED = async (data: any) => {
  console.log({ data });
};

const userSpecialPermissionEventHandlers = {
  [eventTypes.CREATED]: USER_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: USER_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: USER_SPECIAL_PERMISSION_DELETED,
};

export const USER_SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userSpecialPermissionEventHandlers[data.action](data);
  }
};
