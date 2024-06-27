import { FeatureFlagPostgresService } from '../../../../modules/postgres/settings/featureFlags.pg';
import { eventTypes } from '../common';

const FEATURE_FLAG_UPDATED = async (data: any) => {
  const rpgs = new FeatureFlagPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const FEATURE_FLAG_DELETED = async (data: any) => {
  const rpgs = new FeatureFlagPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const featureFlagEventHandlers = {
  [eventTypes.CREATED]: FEATURE_FLAG_UPDATED,
  [eventTypes.UPDATED]: FEATURE_FLAG_UPDATED,
  [eventTypes.DELETED]: FEATURE_FLAG_DELETED,
};

export const FEATURE_FLAG_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await featureFlagEventHandlers[data.action](data.record);
  }
};
