import { eventTypes } from '../common';

const ROLE_PERMISSION_UPDATED = async (data: any) => {
  console.log({ data });
};

const ROLE_PERMISSION_DELETED = async (data: any) => {
  console.log({ data });
};

const rolePermissionEventHandlers = {
  [eventTypes.CREATED]: ROLE_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: ROLE_PERMISSION_UPDATED,
  [eventTypes.DELETED]: ROLE_PERMISSION_DELETED,
};

export const ROLE_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await rolePermissionEventHandlers[data.action](data);
  }
};
