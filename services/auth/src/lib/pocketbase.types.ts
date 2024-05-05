import PocketBase, { BaseModel, RecordService } from '@neoncoder/pocketbase';
// import { BaseModel, RecordService } from 'pocketbase/dist/pocketbase.es.mjs'

// const PocketBase = require('pocketbase/cjs')

type JSONPrimitive = string | number | boolean | null | undefined | any;

type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };

export interface User extends BaseModel {
  username: string;
  email: string;
  name: string;
  avatar: string;
  phone: string;
  phoneData: JSONValue;
}

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  // collection(idOrName: string): RecordService // default fallback for any other collection
  // collection(idOrName: 'tasks'): RecordService<Task>
}
