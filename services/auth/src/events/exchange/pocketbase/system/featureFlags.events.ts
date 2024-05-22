import { eventTypes } from '../common';

const FEATURE_FLAG_UPDATED = async (data: any) => {
  console.log({ data });
};

const FEATURE_FLAG_DELETED = async (data: any) => {
  console.log({ data });
};

const featureFlagEventHandlers = {
  [eventTypes.CREATED]: FEATURE_FLAG_UPDATED,
  [eventTypes.UPDATED]: FEATURE_FLAG_UPDATED,
  [eventTypes.DELETED]: FEATURE_FLAG_DELETED,
};

export const FEATURE_FLAG_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await featureFlagEventHandlers[data.action](data);
  }
};
