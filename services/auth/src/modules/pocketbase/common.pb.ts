import { CustomError, IDataAccess, TStatus, TStatusCode, statusCMap } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../../lib/pocketbase';
import { TypedPocketBase, collections, keys } from '../../lib/pocketbase.types';
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
import { TPagination } from '../postgres/common.pg';

export default abstract class PBService<Keys extends string, T> implements IDataAccess<Keys, T> {
  pb: ReturnType<typeof getPocketBase>;
  result: TStatus<Keys, T> | undefined;
  collection: typeof keys;

  constructor(collection: keyof typeof collections, pocketbaseInstance?: TypedPocketBase) {
    this.pb = pocketbaseInstance ?? getPocketBase();
    this.collection = collection;
  }

  getList<T>({ page = 1, limit = 50, options }: TPagination & { options?: RecordListOptions }) {
    return this.pb.collection(this.collection).getList<T>(page, limit, options);
  }

  getFullList<T>({ options }: { options?: RecordFullListOptions }) {
    return this.pb.collection(this.collection).getFullList<T>(options);
  }

  getOne<T>({ id, options }: { id: string; options?: RecordOptions }) {
    return this.pb.collection(this.collection).getOne<T>(id, options);
  }

  getFirstListItem<T>({ filter, options }: { filter: string; options?: RecordListOptions }) {
    return this.pb.collection(this.collection).getFirstListItem<T>(filter, options);
  }

  create<T>({ data, options }: { data: { [key: string]: any } | FormData; options?: RecordOptions }) {
    return this.pb.collection(this.collection).create<T>(data, options);
  }

  update<T>({ id, data, options }: { id: string; data: { [key: string]: any } | FormData; options?: RecordOptions }) {
    return this.pb.collection(this.collection).update<T>(id, data, options);
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

  paginate(pages: number, page: number) {
    const prev = pages > 1 && page <= pages && page - 1 > 0 ? page - 1 : null;
    const next = pages > 1 && page < pages && page > 0 ? page + 1 : null;
    return { prev, next };
  }

  requestMeta(options?: RecordListOptions) {
    const filters = options?.filter;
    const include = options?.expand;
    const orderBy = options?.sort;
    return { filters, orderBy, include };
  }

  formatError(error: any, msg?: string) {
    const message = msg ?? error.message;
    if (error instanceof ClientResponseError) {
      this.result = statusCMap.get(error.status as TStatusCode)!({ error: error.response, message });
      return;
    }
    if (error instanceof CustomError) {
      this.result = statusCMap.get(error.code)!({ error, message });
      return;
    }
    this.result = statusCMap.get(500)!({ error, message });
  }

  sanitize<T extends object>(fields: string[], data: Partial<T>) {
    const sanitizedData = sanitizeData<T>(fields, data);
    return sanitizedData;
  }
}
