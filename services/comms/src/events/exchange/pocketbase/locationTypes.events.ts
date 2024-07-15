import { getPocketBase } from '../../../lib/pocketbase';
import { LocationTypePostgresService } from '../../../modules/postgres/locationType.pg';
import { eventTypes } from './common';

const LOCATIONTYPE_UPDATED = async (data: any) => {
  const uspgs = new LocationTypePostgresService({});
  const { result: check } = await uspgs.findById({ id: data.id });
  if (data.icon) {
    const pb = getPocketBase(true);
    data.iconUrl = pb.files.getUrl(data, data.icon);
  }
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await uspgs.update(data) : await uspgs.create(data);
  return result;
};

const LOCATIONTYPE_DELETED = async (data: any) => {
  const uspgs = new LocationTypePostgresService({});
  const { result } = await (await uspgs.findById({ id: data.id })).delete();
  return result;
};

const locationTypeEventHandlers = {
  [eventTypes.CREATED]: LOCATIONTYPE_UPDATED,
  [eventTypes.UPDATED]: LOCATIONTYPE_UPDATED,
  [eventTypes.DELETED]: LOCATIONTYPE_DELETED,
};

export const LOCATIONTYPE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await locationTypeEventHandlers[data.action](data.record);
  }
};
