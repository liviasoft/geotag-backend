import { FeaturePostgresService } from '../../../../modules/postgres/settings/features.pg';
import { eventTypes } from '../common';

const FEATURE_UPDATED = async (data: any) => {
  const fpgs = new FeaturePostgresService({});
  const { result: check } = await fpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await fpgs.update(data) : await fpgs.create(data);
  return result;
};

const FEATURE_DELETED = async (data: any) => {
  const fpgs = new FeaturePostgresService({});
  const { result } = await (await fpgs.findById({ id: data.id })).delete();
  return result;
};

const featureEventHandlers = {
  [eventTypes.CREATED]: FEATURE_UPDATED,
  [eventTypes.UPDATED]: FEATURE_UPDATED,
  [eventTypes.DELETED]: FEATURE_DELETED,
};

export const FEATURE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await featureEventHandlers[data.action](data.record);
  }
};
