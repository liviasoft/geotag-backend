import PocketBase, { BaseModel, RecordService } from '@neoncoder/pocketbase';

const typeOptions = ['boolean', 'number', 'string', 'list', 'object', 'objectList'];

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

export interface UserSetting extends BaseModel {
  name: string;
  type: (typeof typeOptions)[number];
  boolean?: boolean;
  number?: number;
  string?: string;
  list?: JSONValue;
  object?: JSONValue;
  objectList?: JSONValue;
}

export interface AppSetting extends BaseModel {
  name: string;
  type: (typeof typeOptions)[number];
  boolean?: boolean;
  number?: number;
  string?: string;
  list?: JSONValue;
  object?: JSONValue;
  objectList?: JSONValue;
}

export interface Feature extends BaseModel {
  name: string;
  description: string;
  active: boolean;
  scope: string;
}

export interface FeatureFlag extends BaseModel {
  feature: string;
  name: string;
  service: string[];
  description: string;
  active: boolean;
}

export interface Resource extends BaseModel {
  name: string;
  description: string;
}

export interface Role extends BaseModel {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface RolePermission extends BaseModel {
  role: string;
  resource: string;
  create: boolean;
  updateOwn: boolean;
  updateAny: boolean;
  deleteOwn: boolean;
  deleteAny: boolean;
  readOwn: boolean;
  readAny: boolean;
}

export interface SpecialPermission extends BaseModel {
  name: string;
  description: string;
  active: boolean;
}

export interface RoleSpecialPermission extends BaseModel {
  role: string;
  specialPermission: string;
  description: string;
  active: boolean;
}

export interface UserFeatureBan extends BaseModel {
  user: string;
  feature: string;
  expiresAt: string;
}

export interface UserResourcePermission extends BaseModel {
  user: string;
  resource: string;
  create: boolean;
  updateOwn: boolean;
  updateAny: boolean;
  deleteOwn: boolean;
  deleteAny: boolean;
  readOwn: boolean;
  readAny: boolean;
}

export interface UserSpecialPermission extends BaseModel {
  user: string;
  specialPermission: string;
  description: string;
  active: boolean;
}

export enum collectionNames {
  'users',
  'appSettings',
  'features',
  'featureFlags',
  'resources',
  'roles',
  'rolePermissions',
  'userSpecialPermissions',
}

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'appSettings'): RecordService<AppSetting>;
  collection(idOrName: 'features'): RecordService<Feature>;
  collection(idOrName: 'featureFlags'): RecordService<FeatureFlag>;
  collection(idOrName: 'resources'): RecordService<Resource>;
  collection(idOrName: 'roles'): RecordService<Role>;
  collection(idOrName: 'rolePermissions'): RecordService<RolePermission>;
  collection(idOrName: 'roleSpecialPermissions'): RecordService<RoleSpecialPermission>;
  collection(idOrName: 'specialPermissions'): RecordService<SpecialPermission>;
  collection(idOrName: 'userFeatureBans'): RecordService<UserFeatureBan>;
  collection(idOrName: 'userResourcePermissions'): RecordService<UserResourcePermission>;
  collection(idOrName: 'userSpecialPermissions'): RecordService<UserSpecialPermission>;
  collection(idOrName: 'userSettings'): RecordService<UserSetting>;
  collection(idOrName: string): RecordService; // default fallback for any other collection
  // collection(idOrName: 'tasks'): RecordService<Task>
}
