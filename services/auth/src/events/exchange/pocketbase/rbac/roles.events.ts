import { RolePostgresService } from '../../../../modules/postgres/settings/roles.pg';
import { eventTypes } from '../common';

const ROLE_UPDATED = async (data: any) => {
  const rpgs = new RolePostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const ROLE_DELETED = async (data: any) => {
  const rpgs = new RolePostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const roleEventHandlers = {
  [eventTypes.CREATED]: ROLE_UPDATED,
  [eventTypes.UPDATED]: ROLE_UPDATED,
  [eventTypes.DELETED]: ROLE_DELETED,
};

export const ROLE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await roleEventHandlers[data.action](data.record);
  }
};
