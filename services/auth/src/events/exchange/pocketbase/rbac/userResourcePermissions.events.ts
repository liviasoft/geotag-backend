import { eventTypes } from '../common';

const USER_RESOURCE_PERMISSION_UPDATED = async (data: any) => {
  console.log({ data });
};

const USER_RESOURCE_PERMISSION_DELETED = async (data: any) => {
  console.log({ data });
};

const userResourcePermissionEventHandlers = {
  [eventTypes.CREATED]: USER_RESOURCE_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: USER_RESOURCE_PERMISSION_UPDATED,
  [eventTypes.DELETED]: USER_RESOURCE_PERMISSION_DELETED,
};

export const USER_RESOURCE_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userResourcePermissionEventHandlers[data.action](data);
  }
};
