import { getPocketBase } from '../../../lib/pocketbase';
import { UserPostgresService } from '../../../modules/postgres/user.pg';
import { eventTypes } from './common';

const USER_UPDATED = async (data: any) => {
  const upgs = new UserPostgresService({});
  if (data.avatar) {
    const pb = getPocketBase(true);
    data.avatarUrl = pb.files.getUrl(data, data.avatar);
  }
  const { result: check } = await upgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { roles } = data;
  if (roles)
    data.roles = exists
      ? roles.length
        ? { set: roles.map((x: string) => ({ id: x })) }
        : { set: [] }
      : { connect: roles.map((x: string) => ({ id: x })) };
  const { result } = exists ? await upgs.update(data) : await upgs.create(data);
  return result;
};

const USER_DELETED = async (data: any) => {
  const upgs = new UserPostgresService({});
  const { result } = await (await upgs.findById({ id: data.id })).delete();
  return result;
};

const userEventHandlers = {
  [eventTypes.CREATED]: USER_UPDATED,
  [eventTypes.UPDATED]: USER_UPDATED,
  [eventTypes.DELETED]: USER_DELETED,
};

export const USER_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await userEventHandlers[data.action](data.record);
  }
};
