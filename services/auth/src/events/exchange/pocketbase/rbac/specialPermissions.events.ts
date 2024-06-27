import { SpecialPermissionPostgresService } from '../../../../modules/postgres/settings/specialPermissions.pg';
import { eventTypes } from '../common';

const SPECIAL_PERMISSION_UPDATED = async (data: any) => {
  const rpgs = new SpecialPermissionPostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const SPECIAL_PERMISSION_DELETED = async (data: any) => {
  const rpgs = new SpecialPermissionPostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const specialPermissionEventHandlers = {
  [eventTypes.CREATED]: SPECIAL_PERMISSION_UPDATED,
  [eventTypes.UPDATED]: SPECIAL_PERMISSION_UPDATED,
  [eventTypes.DELETED]: SPECIAL_PERMISSION_DELETED,
};

export const SPECIAL_PERMISSION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await specialPermissionEventHandlers[data.action](data.record);
  }
};
