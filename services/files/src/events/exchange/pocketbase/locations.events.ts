import { LocationPostgresService } from '../../../modules/postgres/location.pg';
import { eventTypes } from './common';

const LOCATION_UPDATED = async (data: any) => {
  const lpgs = new LocationPostgresService({});
  const { result: check } = await lpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { contacts } = data;
  if (contacts)
    data.contacts = exists
      ? contacts.length
        ? { set: contacts.map((x: string) => ({ id: x })) }
        : { set: [] }
      : { connect: contacts.map((x: string) => ({ id: x })) };
  const { result } = exists ? await lpgs.update(data) : await lpgs.create(data);
  return result;
};

const LOCATION_DELETED = async (data: any) => {
  const lpgs = new LocationPostgresService({});
  const { result } = await (await lpgs.findById({ id: data.id })).delete();
  return result;
};

const locationEventHandlers = {
  [eventTypes.CREATED]: LOCATION_UPDATED,
  [eventTypes.UPDATED]: LOCATION_UPDATED,
  [eventTypes.DELETED]: LOCATION_DELETED,
};

export const LOCATION_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await locationEventHandlers[data.action](data.record);
  }
};
