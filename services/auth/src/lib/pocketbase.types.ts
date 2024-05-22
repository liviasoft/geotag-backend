import PocketBase, { BaseModel, RecordService } from 'pocketbase';
// import { BaseModel, RecordService } from 'pocketbase/dist/pocketbase.es.mjs'

// const PocketBase = require('pocketbase/cjs')

export interface User extends BaseModel {
  username: string;
  email: string;
  name: string;
  avatar: string;
}

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  // collection(idOrName: string): RecordService // default fallback for any other collection
  // collection(idOrName: 'tasks'): RecordService<Task>
}
