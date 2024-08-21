import { getPocketBase } from '../../../lib/pocketbase';
import { getIO } from '../../../lib/socketio';
import { LocationNotePostgresService } from '../../../modules/postgres/locationNotes.pg';
import { eventTypes } from './common';

const LOCATIONNOTE_UPDATED = async (data: any) => {
  const lpgs = new LocationNotePostgresService({});
  if (data.image) {
    const pb = getPocketBase(true);
    data.imageUrl = pb.files.getUrl(data, data.image);
  }
  const { result: check } = await lpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  const { result } = exists
    ? await lpgs.update(data, { authorData: true, locationData: true, measurementFileData: true })
    : await lpgs.create(data, { authorData: true, locationData: true, measurementFileData: true });
  console.log(result);
  if (result?.statusType === 'OK' || result?.statusType === 'Created') {
    if (exists) {
      console.log('emitting to client - exists');
      getIO().to(data.location).emit('LOCATIONNOTE_UPDATED', result.data?.locationNote);
    } else {
      console.log('emitting to client - new');
      getIO().to(data.location).emit('LOCATIONNOTE_CREATED', result.data?.locationNote);
    }
  }
  return result;
};

const LOCATIONNOTE_DELETED = async (data: any) => {
  const lpgs = new LocationNotePostgresService({});
  const { result } = await (await lpgs.findById({ id: data.id })).delete();
  getIO().to(data.location).emit('LOCATIONNOTE_DELETED', data.id);
  return result;
};

const locationNoteEventHandlers = {
  [eventTypes.CREATED]: LOCATIONNOTE_UPDATED,
  [eventTypes.UPDATED]: LOCATIONNOTE_UPDATED,
  [eventTypes.DELETED]: LOCATIONNOTE_DELETED,
};

export const LOCATIONNOTE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await locationNoteEventHandlers[data.action](data.record);
  }
};
