import { eventTypes } from '../common';

const FEATURE_UPDATED = async (data: any) => {
  console.log({ data });
};

const FEATURE_DELETED = async (data: any) => {
  console.log({ data });
};

const featureEventHandlers = {
  [eventTypes.CREATED]: FEATURE_UPDATED,
  [eventTypes.UPDATED]: FEATURE_UPDATED,
  [eventTypes.DELETED]: FEATURE_DELETED,
};

export const FEATURE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await featureEventHandlers[data.action](data);
  }
};
