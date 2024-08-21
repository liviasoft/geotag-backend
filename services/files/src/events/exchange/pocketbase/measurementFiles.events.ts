import { getPocketBase } from '../../../lib/pocketbase';
import { MeasurementFilePostgresService } from '../../../modules/postgres/measurementFile.pg';
import { eventTypes } from './common';

const MEASUREMENTFILE_UPDATED = async (data: any) => {
  const mfpgs = new MeasurementFilePostgresService({});
  if (data.file) {
    const pb = getPocketBase(true);
    data.fileUrl = pb.files.getUrl(data, data.file);
  }
  const { result: check } = await mfpgs.findById({ id: data.id });
  const exists = check?.statusType === 'OK';
  // const { contacts } = data;
  // if (contacts)
  //   data.contacts = exists
  //     ? contacts.length
  //       ? { set: contacts.map((x: string) => ({ id: x })) }
  //       : { set: [] }
  //     : { connect: contacts.map((x: string) => ({ id: x })) };
  const { result } = exists ? await mfpgs.update(data) : await mfpgs.create(data);
  return result;
};

const MEASUREMENTFILE_DELETED = async (data: any) => {
  const mfpgs = new MeasurementFilePostgresService({});
  const { result } = await (await mfpgs.findById({ id: data.id })).delete();
  return result;
};

const measurementFileEventHandlers = {
  [eventTypes.CREATED]: MEASUREMENTFILE_UPDATED,
  [eventTypes.UPDATED]: MEASUREMENTFILE_UPDATED,
  [eventTypes.DELETED]: MEASUREMENTFILE_DELETED,
};

export const MEASUREMENTFILE_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(eventTypes).includes(data.action)) {
    await measurementFileEventHandlers[data.action](data.record);
  }
};
