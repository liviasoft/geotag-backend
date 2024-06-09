import { ScopePostgresService } from '../../../../modules/postgres/settings/scopes.pg';
import { eventTypes } from '../common';

const SCOPE_UPDATED = async (data: any) => {
  const spgs = new ScopePostgresService({});
  const { result: check } = await spgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await spgs.update(data) : await spgs.create(data);
  return result;
};

const SCOPE_DELETED = async (data: any) => {
  const spgs = new ScopePostgresService({});
  const { result } = await (await spgs.findById({ id: data.id })).delete();
  return result;
};

const scopeEventHandlers = {
  [eventTypes.CREATED]: SCOPE_UPDATED,
  [eventTypes.UPDATED]: SCOPE_UPDATED,
  [eventTypes.DELETED]: SCOPE_DELETED,
};

export const SCOPE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await scopeEventHandlers[data.action](data.record);
  }
};
