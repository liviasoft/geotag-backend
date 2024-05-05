import { eventTypes } from '../common';

const USER_FEATURE_BAN_UPDATED = async (data: any) => {
  console.log({ data });
};

const USER_FEATURE_BAN_DELETED = async (data: any) => {
  console.log({ data });
};

const userFeatureBanEventHandlers = {
  [eventTypes.CREATED]: USER_FEATURE_BAN_UPDATED,
  [eventTypes.UPDATED]: USER_FEATURE_BAN_UPDATED,
  [eventTypes.DELETED]: USER_FEATURE_BAN_DELETED,
};

export const USER_FEATURE_BAN_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userFeatureBanEventHandlers[data.action](data);
  }
};
