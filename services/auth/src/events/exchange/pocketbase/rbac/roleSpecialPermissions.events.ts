import { eventTypes } from '../common';

const ROLE_SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  console.log({ data });
};

const ROLE_SPECIAL_PERMISSION_DELETED = async (data: any) => {
  console.log({ data });
};

const roleSpecialPermissionEventHandlers = {
  [eventTypes.CREATED]: ROLE_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: ROLE_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: ROLE_SPECIAL_PERMISSION_DELETED,
};

export const ROLE_SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await roleSpecialPermissionEventHandlers[data.action](data);
  }
};
