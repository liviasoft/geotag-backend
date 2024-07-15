import PocketBase, { RecordModel, RecordService } from '@neoncoder/pocketbase';

const typeOptions = ['boolean', 'number', 'string', 'list', 'object', 'objectList'];

type JSONPrimitive = string | number | boolean | null | undefined | any;

type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };

export interface User extends RecordModel {
  username: string;
  email: string;
  name: string;
  avatar: string;
  phone: string;
  phoneData: JSONValue;
}

export interface UserSetting extends RecordModel {
  name: string;
  description: string;
  type: (typeof typeOptions)[number];
  boolean?: boolean;
  number?: number;
  string?: string;
  list?: JSONValue;
  object?: JSONValue;
  objectList?: JSONValue;
}

export interface AppSetting extends RecordModel {
  name: string;
  description: string;
  type: (typeof typeOptions)[number];
  boolean?: boolean;
  number?: number;
  string?: string;
  list?: JSONValue;
  object?: JSONValue;
  objectList?: JSONValue;
}

export interface MessageTemplate extends RecordModel {
  name: string;
  description?: string;
  requiredFields?: JSONValue;
  emailTemplate?: string;
  smsTemplate?: string;
  pushNotificationTemplate?: string;
}

export interface Location extends RecordModel {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  locationType: string;
}

export interface LocationType extends RecordModel {
  name: string;
  description?: string;
  icon: string;
}

export enum collections {
  users = 'users',
  appSettings = 'appSettings',
  userSettings = 'userSettings',
  locations = 'locations',
  locationTypes = 'locationTypes',
}

export const keys = Object.keys(collections) as unknown as keyof typeof collections;
//               ^?
export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'appSettings'): RecordService<AppSetting>;
  collection(idOrName: 'userSettings'): RecordService<UserSetting>;
  collection(idOrName: 'users'): RecordService<MessageTemplate>;
  collection(idOrName: 'locations'): RecordService<Location>;
  collection(idOrName: 'locationTypes'): RecordService<LocationType>;
  collection(idOrName: string): RecordService; // default fallback for any other collection
  // collection(idOrName: 'tasks'): RecordService<Task>
}
