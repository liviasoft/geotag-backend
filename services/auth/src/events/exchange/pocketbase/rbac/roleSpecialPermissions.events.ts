import { RoleSpecialPermissionPostgresService } from '../../../../modules/postgres/settings/roleSpecialPermissions.pg';
import { eventTypes } from '../common';

const ROLE_SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  const rpgs = new RoleSpecialPermissionPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const ROLE_SPECIAL_PERMISSION_DELETED = async (data: any) => {
  const rpgs = new RoleSpecialPermissionPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const roleSpecialPermissionEventHandlers = {
  [eventTypes.CREATED]: ROLE_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: ROLE_SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: ROLE_SPECIAL_PERMISSION_DELETED,
};

export const ROLE_SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await roleSpecialPermissionEventHandlers[data.action](data.record);
  }
};
