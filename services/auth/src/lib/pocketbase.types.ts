import PocketBase, { RecordModel, RecordService } from '@neoncoder/pocketbase';

const typeOptions = ['boolean', 'number', 'string', 'list', 'object', 'objectList'];

export type JSONPrimitive = string | number | boolean | null | undefined | any;

export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };

export interface User extends RecordModel {
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  avatarUrl: string;
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

export interface Feature extends RecordModel {
  name: string;
  description: string;
  active: boolean;
  scope: string;
}

export interface FeatureFlag extends RecordModel {
  feature: string;
  name: string;
  service: string[];
  description?: string;
  active: boolean;
}

export interface Resource extends RecordModel {
  name: string;
  description?: string;
}

export interface Role extends RecordModel {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface RolePermission extends RecordModel {
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

export interface SpecialPermission extends RecordModel {
  name: string;
  description: string;
  active: boolean;
}

export interface RoleSpecialPermission extends RecordModel {
  role: string;
  specialPermission: string;
  description: string;
  active: boolean;
}

export interface UserFeatureBan extends RecordModel {
  user: string;
  feature: string;
  expiresAt: string;
}

export interface UserResourcePermission extends RecordModel {
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

export interface UserSpecialPermission extends RecordModel {
  user: string;
  specialPermission: string;
  description: string;
  active: boolean;
}

export interface Location extends RecordModel {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  locationType: string;
  contacts?: string[];
}

export interface LocationType extends RecordModel {
  name: string;
  description?: string;
  icon: string;
}

export interface Contact extends RecordModel {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export enum collections {
  users = 'users',
  appSettings = 'appSettings',
  features = 'features',
  featureFlags = 'featureFlags',
  resources = 'resources',
  roles = 'roles',
  rolePermissions = 'rolePermissions',
  roleSpecialPermissions = 'roleSpecialPermissions',
  specialPermissions = 'specialPermissions',
  userFeatureBans = 'userFeatureBans',
  userResourcePermissions = 'userResourcePermissions',
  userSpecialPermissions = 'userSpecialPermissions',
  userSettings = 'userSettings',
  locations = 'locations',
  locationTypes = 'locationTypes',
  contacts = 'contacts',
}

export const keys = Object.keys(collections) as unknown as keyof typeof collections;
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
  collection(idOrName: 'locations'): RecordService<Location>;
  collection(idOrName: 'locationTypes'): RecordService<LocationType>;
  collection(idOrName: 'contacts'): RecordService<Contact>;
  collection(idOrName: string): RecordService; // default fallback for any other collection
  // collection(idOrName: 'tasks'): RecordService<Task>
}
