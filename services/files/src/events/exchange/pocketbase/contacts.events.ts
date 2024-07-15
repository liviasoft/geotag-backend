import { ContactPostgresService } from '../../../modules/postgres/contact.pg';
import { eventTypes } from './common';

const CONTACT_UPDATED = async (data: any) => {
  const lpgs = new ContactPostgresService({});
  const { result: check } = await lpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await lpgs.update(data) : await lpgs.create(data);
  return result;
};

const CONTACT_DELETED = async (data: any) => {
  const uspgs = new ContactPostgresService({});
  const { result } = await (await uspgs.findById({ id: data.id })).delete();
  return result;
};

const contactEventHandlers = {
  [eventTypes.CREATED]: CONTACT_UPDATED,
  [eventTypes.UPDATED]: CONTACT_UPDATED,
  [eventTypes.DELETED]: CONTACT_DELETED,
};

export const CONTACT_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await contactEventHandlers[data.action](data.record);
  }
};
