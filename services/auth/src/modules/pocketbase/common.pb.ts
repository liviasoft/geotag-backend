import { IDataAccess, TStatus, statusMap } from '@neoncoder/service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { TypedPocketBase } from '../../lib/pocketbase.types';
import {
  ClientResponseError,
  CommonOptions,
  FileOptions,
  RecordFullListOptions,
  RecordListOptions,
  RecordModel,
  RecordOptions,
  RecordSubscription,
  SendOptions,
} from '@neoncoder/pocketbase';
import { sanitizeData } from '@neoncoder/validator-utils';

export default class PBService implements IDataAccess {
  pb: ReturnType<typeof getPocketBase>;
  result: TStatus | undefined;
  collection: string;

  constructor(collection: string, pocketbaseInstance?: TypedPocketBase) {
    this.pb = pocketbaseInstance ?? getPocketBase();
    this.collection = collection;
  }

  getList({ page = 1, limit = 50, options }: { page: number; limit: 50; options?: RecordListOptions }) {
    return this.pb.collection(this.collection).getList(page, limit, options);
  }

  getFullList({ options }: { options?: RecordFullListOptions }) {
    return this.pb.collection(this.collection).getFullList(options);
  }

  getOne({ id, options }: { id: string; options?: RecordOptions }) {
    return this.pb.collection(this.collection).getOne(id, options);
  }

  getFirstListItem({ filter, options }: { filter: string; options?: RecordListOptions }) {
    return this.pb.collection(this.collection).getFirstListItem(filter, options);
  }

  create({ data, options }: { data: { [key: string]: any } | FormData; options?: RecordOptions }) {
    return this.pb.collection(this.collection).create(data, options);
  }

  update({ id, data, options }: { id: string; data: { [key: string]: any } | FormData; options?: RecordOptions }) {
    return this.pb.collection(this.collection).update(id, data, options);
  }

  delete({ id, options }: { id: string; options?: CommonOptions }) {
    return this.pb.collection(this.collection).delete(id, options);
  }

  getFileUrl({
    record,
    filename,
    options,
  }: {
    record: { [key: string]: any };
    filename: string;
    options: FileOptions;
  }) {
    return this.pb.getFileUrl(record, filename, options);
  }

  subscribeToCollection({
    callback,
    options,
  }: {
    callback?: (data: RecordSubscription<RecordModel>) => void;
    options?: SendOptions;
  }) {
    const defaultFxn = (data: RecordSubscription<RecordModel>) => console.log({ data });
    const callbackFxn = callback ?? defaultFxn;
    return this.pb.collection(this.collection).subscribe('*', callbackFxn, options);
  }

  subscribeToRecord({
    id,
    callback,
    options,
  }: {
    id: string;
    callback?: (data: RecordSubscription<RecordModel>) => void;
    options?: SendOptions;
  }) {
    const defaultFxn = (data: RecordSubscription<RecordModel>) => console.log({ data });
    const callbackFxn = callback ?? defaultFxn;
    return this.pb.collection(this.collection).subscribe(id, callbackFxn, options);
  }

  unsubscribe({ topic }: { topic?: string }) {
    return topic
      ? this.pb.collection(this.collection).unsubscribe(topic)
      : this.pb.collection(this.collection).unsubscribe();
  }

  formatError(error: any, msg?: string) {
    const message = msg ?? error.message;
    if (error instanceof ClientResponseError) {
      this.result = statusMap.get(error.status)!({ error: error.response, message });
      return;
    }
    this.result = statusMap.get(500)!({ error, message });
  }

  sanitize(fields: string[], data: any) {
    const sanitizedData = sanitizeData(fields, data);
    return sanitizedData;
  }
}
