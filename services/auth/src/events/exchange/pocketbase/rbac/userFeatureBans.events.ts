import { UserFeatureBanPostgresService } from '../../../../modules/postgres/settings/userFeatureBans.pg';
import { eventTypes } from '../common';

const USER_FEATURE_BAN_UPDATED = async (data: any) => {
  const rpgs = new UserFeatureBanPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const USER_FEATURE_BAN_DELETED = async (data: any) => {
  const rpgs = new UserFeatureBanPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const userFeatureBanEventHandlers = {
  [eventTypes.CREATED]: USER_FEATURE_BAN_UPDATED,
  [eventTypes.UPDATED]: USER_FEATURE_BAN_UPDATED,
  [eventTypes.DELETED]: USER_FEATURE_BAN_DELETED,
};

export const USER_FEATURE_BAN_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userFeatureBanEventHandlers[data.action](data.record);
  }
};
