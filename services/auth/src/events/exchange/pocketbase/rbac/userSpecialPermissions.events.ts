import { UserSpecialPermissionPostgresService } from '../../../../modules/postgres/settings/userSpecialPermissions.pg';
import { eventTypes } from '../common';

const USER_SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  const rpgs = new UserSpecialPermissionPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const USER_SPECIAL_PERMISSION_DELETED = async (data: any) => {
  const rpgs = new UserSpecialPermissionPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const userSpecialPermissionEventHandlers = {
  [eventTypes.CREATED]: USER_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: USER_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: USER_SPECIAL_PERMISSION_DELETED,
};

export const USER_SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userSpecialPermissionEventHandlers[data.action](data.record);
  }
};
