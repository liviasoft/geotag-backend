import { UserSettingPostgresService } from '../../../../modules/postgres/settings/userSettings.pg';
import { eventTypes } from '../common';

const USERSETTING_UPDATED = async (data: any) => {
  const uspgs = new UserSettingPostgresService({});
  const { result: check } = await uspgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await uspgs.update(data) : await uspgs.create(data);
  return result;
};

const USERSETTING_DELETED = async (data: any) => {
  const uspgs = new UserSettingPostgresService({});
  const { result } = await (await uspgs.findById({ id: data.id })).delete();
  return result;
};

const userSettingEventHandlers = {
  [eventTypes.CREATED]: USERSETTING_UPDATED,
  [eventTypes.UPDATED]: USERSETTING_UPDATED,
  [eventTypes.DELETED]: USERSETTING_DELETED,
};

export const USERSETTING_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userSettingEventHandlers[data.action](data.record);
  }
};
