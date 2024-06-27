import { MessageTemplatePostgresService } from '../../../modules/postgres/messageTemplates.pg';
import { eventTypes } from './common';

const MESSAGE_TEMPLATE_UPDATED = async (data: any) => {
  const mtpgs = new MessageTemplatePostgresService({});
  console.log(data);
  const { result: check } = await mtpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists ? await mtpgs.update(data) : await mtpgs.create(data);
  return result;
};

const MESSAGE_TEMPLATE_DELETED = async (data: any) => {
  const mtpgs = new MessageTemplatePostgresService({});
  const { result } = await (await mtpgs.findById({ id: data.id })).delete();
  return result;
};

const userEventHandlers = {
  [eventTypes.CREATED]: MESSAGE_TEMPLATE_UPDATED,
  [eventTypes.UPDATED]: MESSAGE_TEMPLATE_UPDATED,
  [eventTypes.DELETED]: MESSAGE_TEMPLATE_DELETED,
};

export const MESSAGE_TEMPLATE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userEventHandlers[data.action](data.record);
  }
};
