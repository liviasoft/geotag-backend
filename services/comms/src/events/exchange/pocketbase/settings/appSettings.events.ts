import { AppSettingsPostgresService } from '../../../../modules/postgres/settings/appSettings.pg';
import { eventTypes } from '../common';

const APPSETTING_UPDATED = async (data: any) => {
  const aspgs = new AppSettingsPostgresService({});
  console.log(data);
  const { result: check } = await aspgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await aspgs.update(data) : await aspgs.create(data);
  return result;
};

const APPSETTING_DELETED = async (data: any) => {
  const aspgs = new AppSettingsPostgresService({});
  const { result } = await (await aspgs.findById({ id: data.id })).delete();
  return result;
};

const appSettingEventHandlers = {
  [eventTypes.CREATED]: APPSETTING_UPDATED,
  [eventTypes.UPDATED]: APPSETTING_UPDATED,
  [eventTypes.DELETED]: APPSETTING_DELETED,
};

export const APPSETTING_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await appSettingEventHandlers[data.action](data.record);
  }
};
