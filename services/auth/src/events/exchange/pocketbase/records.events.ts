import { RESOURCE_EVENTS } from './rbac/resources.events';
import { ROLE_PERMISSION_EVENTS } from './rbac/rolePermissions.events';
import { ROLE_SPECIAL_PERMISSION_EVENTS } from './rbac/roleSpecialPermissions.events';
import { ROLE_EVENTS } from './rbac/roles.events';
import { SPECIAL_PERMISSION_EVENTS } from './rbac/specialPermissions.events';
import { USER_FEATURE_BAN_EVENTS } from './rbac/userFeatureBans.events';
import { USER_RESOURCE_PERMISSION_EVENTS } from './rbac/userResourcePermissions.events';
import { USER_SPECIAL_PERMISSION_EVENTS } from './rbac/userSpecialPermissions.events';
import { APPSETTING_EVENTS } from './system/appSettings.events';
import { FEATURE_FLAG_EVENTS } from './system/featureFlags.events';
import { FEATURE_EVENTS } from './system/features.events';
import { SCOPE_EVENTS } from './system/scopes.events';
import { USERSETTING_EVENTS } from './system/userSettings.events';
import { USER_EVENTS } from './users.events';

const collections = {
  APPSETTINGS: 'APPSETTINGS',
  USERSETTINGS: 'USERSETTINGS',
  SCOPES: 'SCOPES',
  USERS: 'USERS',
  FEATURES: 'FEATURES',
  FEATUREFLAGS: 'FEATUREFLAGS',
  ROLES: 'ROLES',
  RESOURCES: 'RESOURCES',
  ROLEPERMISSIONS: 'ROLEPERMISSIONS',
  SPECIALPERMISSIONS: 'SPECIALPERMISSIONS',
  ROLESPECIALPERMISSIONS: 'ROLESPECIALPERMISSIONS',
  USERFEATUREBANS: 'USERFEATUREBANS',
  USERSPECIALPERMISSIONS: 'USERSPECIALPERMISSIONS',
  USERRESOURCEPERMISSIONS: 'USERRESOURCEPERMISSIONS',
};

const recordsEventHandlers = {
  [collections.APPSETTINGS]: APPSETTING_EVENTS,
  [collections.USERSETTINGS]: USERSETTING_EVENTS,
  [collections.SCOPES]: SCOPE_EVENTS,
  [collections.USERS]: USER_EVENTS,
  [collections.FEATURES]: FEATURE_EVENTS,
  [collections.FEATUREFLAGS]: FEATURE_FLAG_EVENTS,
  [collections.ROLES]: ROLE_EVENTS,
  [collections.RESOURCES]: RESOURCE_EVENTS,
  [collections.ROLEPERMISSIONS]: ROLE_PERMISSION_EVENTS,
  [collections.ROLESPECIALPERMISSIONS]: ROLE_SPECIAL_PERMISSION_EVENTS,
  [collections.SPECIALPERMISSIONS]: SPECIAL_PERMISSION_EVENTS,
  [collections.USERFEATUREBANS]: USER_FEATURE_BAN_EVENTS,
  [collections.USERRESOURCEPERMISSIONS]: USER_RESOURCE_PERMISSION_EVENTS,
  [collections.USERSPECIALPERMISSIONS]: USER_SPECIAL_PERMISSION_EVENTS,
};

export const RECORDS_EVENTS = async (message: any) => {
  const { data } = message;
  if (Object.keys(collections).includes(data.collection)) {
    console.log(`${data.collection} => ${data.action}`);
    await recordsEventHandlers[data.collection](message);
  }
};
