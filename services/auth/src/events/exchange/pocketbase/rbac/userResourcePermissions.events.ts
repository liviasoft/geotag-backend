import { UserResourcePermissionPostgresService } from '../../../../modules/postgres/settings/userResourcePermissions.pg';
import { eventTypes } from '../common';

const USER_RESOURCE_PERMISSION_UPDATED = async (data: any) => {
  const rpgs = new UserResourcePermissionPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const USER_RESOURCE_PERMISSION_DELETED = async (data: any) => {
  const rpgs = new UserResourcePermissionPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const userResourcePermissionEventHandlers = {
  [eventTypes.CREATED]: USER_RESOURCE_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: USER_RESOURCE_PERMISSION_UPDATED,
  [eventTypes.DELETED]: USER_RESOURCE_PERMISSION_DELETED,
};

export const USER_RESOURCE_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userResourcePermissionEventHandlers[data.action](data.record);
  }
};
