import { ResourcePostgresService } from '../../../../modules/postgres/settings/resources.pg';
import { eventTypes } from '../common';

const RESOURCE_UPDATED = async (data: any) => {
  const rpgs = new ResourcePostgresService({});
  const { result: check } = await rpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await rpgs.update(data) : await rpgs.create(data);
  return result;
};

const RESOURCE_DELETED = async (data: any) => {
  const rpgs = new ResourcePostgresService({});
  const { result } = await (await rpgs.findById({ id: data.id })).delete();
  return result;
};

const resourceEventHandlers = {
  [eventTypes.CREATED]: RESOURCE_UPDATED,
  [eventTypes.UPDATED]: RESOURCE_UPDATED,
  [eventTypes.DELETED]: RESOURCE_DELETED,
};

export const RESOURCE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await resourceEventHandlers[data.action](data.record);
  }
};
