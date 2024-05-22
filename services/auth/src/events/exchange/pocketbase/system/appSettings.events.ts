import { eventTypes } from '../common';

const APPSETTING_UPDATED = async (data: any) => {
  console.log({ data });
};

const APPSETTING_DELETED = async (data: any) => {
  console.log({ data });
};

const appSettingEventHandlers = {
  [eventTypes.CREATED]: APPSETTING_UPDATED,
  [eventTypes.UPDATED]: APPSETTING_UPDATED,
  [eventTypes.DELETED]: APPSETTING_DELETED,
};

export const APPSETTING_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await appSettingEventHandlers[data.action](data);
  }
};
