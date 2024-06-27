import { RolePermissionPostgresService } from '../../../../modules/postgres/settings/rolePermissions.pg';
import { eventTypes } from '../common';

const ROLE_PERMISSION_UPDATED = async (data: any) => {
  const rpgs = new RolePermissionPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const ROLE_PERMISSION_DELETED = async (data: any) => {
  const rpgs = new RolePermissionPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const rolePermissionEventHandlers = {
  [eventTypes.CREATED]: ROLE_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: ROLE_PERMISSION_UPDATED,
  [eventTypes.DELETED]: ROLE_PERMISSION_DELETED,
};

export const ROLE_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await rolePermissionEventHandlers[data.action](data.record);
  }
};
