import { arrayToObjectByField, getObjectKeys, isBoolean, isValidDate, isValidString } from '@neoncoder/validator-utils';
import { Feature, FeatureFlag, Role } from '@prisma/client';
import { TScopeWithIncludes } from '../../modules/postgres/settings/scopes.pg';
import { TUserResourcePermissionWithInclude } from '../../modules/postgres/settings/userResourcePermissions.pg';
import { TRolePermissionWithInclude } from '../../modules/postgres/settings/rolePermissions.pg';
import { TUserFeatureBanWithIncludes } from '../../modules/postgres/settings/userFeatureBans.pg';
import { TRoleWithIncludes } from '../../modules/postgres/settings/roles.pg';
import { TUserSpecialPermissionWithInclude } from '../../modules/postgres/settings/userSpecialPermissions.pg';
import { TRoleSpecialPermissionWithInclude } from '../../modules/postgres/settings/roleSpecialPermissions.pg';
import { TSerializedSpecialPermission, TSetting } from './custom.types';
import { TSerializedPermission } from '../../middleware/common.middleware';

export const serializeScope = (scope: TScopeWithIncludes) => {
  const { name, active, features } = scope;
  const scopesData = {
    [`${name}`]: {
      name,
      active,
      features: arrayToObjectByField(
        features
          ? features.map((x: Feature & { featureFlags?: FeatureFlag[] }) => {
              const { name, active, featureFlags } = x;
              return {
                name,
                active,
                featureFlags: arrayToObjectByField(
                  featureFlags
                    ? featureFlags.map((y) => {
                        const { name, active, service } = y;
                        return {
                          name,
                          active,
                          service,
                        };
                      })
                    : [],
                  'name',
                ),
              };
            })
          : [],
        'name',
      ),
    },
  };
  return scopesData;
};

export const serializePermissions = (
  permissions: TUserResourcePermissionWithInclude[] | TRolePermissionWithInclude[],
  isUserSpecific = false,
) => {
  const permsData = arrayToObjectByField(
    permissions.map((x: TUserResourcePermissionWithInclude | TRolePermissionWithInclude) => {
      const { create, readOwn, readAny, updateOwn, updateAny, deleteOwn, deleteAny, resourceData } = x;
      return { create, readOwn, readAny, updateOwn, updateAny, deleteOwn, deleteAny, name: resourceData!.name };
    }),
    'name',
  );
  const serialized: Record<string, any> = {};
  Object.keys(permsData).forEach((p) => {
    if (!serialized[p]) {
      serialized[p] = permsData[p];
    } else {
      getObjectKeys(permsData[p]).forEach((u) => {
        serialized[p][u] = isBoolean(permsData[p][u])
          ? isUserSpecific
            ? permsData[p][u]
            : serialized[p][u] || permsData[p][u]
          : permsData[p][u];
      });
    }
  });
  return serialized;
};

export const serializeRoles = (roles: Role[] | TRoleWithIncludes[]) => {
  return arrayToObjectByField(
    roles.map((x: Role) => {
      const { name, active, requiresAuth, isDefault } = x;
      return { name, active, requiresAuth, isDefault };
    }),
    'name',
  );
};

export const serializeSpecialPermissions = (
  permissions: TUserSpecialPermissionWithInclude[] | TRoleSpecialPermissionWithInclude[],
) => {
  return arrayToObjectByField(
    permissions.map((x: TUserSpecialPermissionWithInclude | TRoleSpecialPermissionWithInclude) => {
      const { active, specialPermissionData, description } = x;
      return { active, description, name: specialPermissionData!.name };
    }),
    'name',
  );
};

export const serializeFeatureBans = (featureBans: TUserFeatureBanWithIncludes[]) => {
  return arrayToObjectByField(
    featureBans.map((x: TUserFeatureBanWithIncludes) => {
      const { featureData, expiresAt } = x;
      const { name, active } = featureData!;
      return {
        name,
        active,
        expiresAt,
        isActive: expiresAt && isValidDate(expiresAt as unknown as string) ? expiresAt > new Date() : false,
      };
    }),
    'name',
  );
};

export const mergePermissions = (userPerms: TSerializedPermission, rolePerms: TSerializedPermission) => {
  const finalPermissions: Record<string, any> = {};
  const allResources = Array.from(new Set([...Object.keys(userPerms), ...Object.keys(rolePerms)])).sort();
  allResources.forEach((r) => {
    if (userPerms[r]) {
      finalPermissions[r] = userPerms[r];
    } else {
      finalPermissions[r] = rolePerms[r];
    }
  });
  return finalPermissions;
};

export const mergeSpecialPermissions = (
  userSpecialPerms: TSerializedSpecialPermission,
  roleSpecialPerms: TSerializedSpecialPermission,
) => {
  const finalPermissions: Record<string, any> = {};
  const allResources = Array.from(new Set([...Object.keys(userSpecialPerms), ...Object.keys(roleSpecialPerms)])).sort();
  allResources.forEach((r) => {
    if (userSpecialPerms[r]) {
      finalPermissions[r] = userSpecialPerms[r];
    } else {
      finalPermissions[r] = roleSpecialPerms[r];
    }
  });
  return finalPermissions;
};

export const constructSettings = <T extends TSetting>(settings: T[]) => {
  const parsedSettings: { [key: string]: any } = {};
  settings.forEach((i: T) => {
    parsedSettings[i.name] = i[i.type];
  });
  return parsedSettings;
};

export const deconstructSettings = <T extends TSetting>(parsedSettings: { [key: string]: any }) => {
  const deconstructedSettings: Array<Partial<TSetting>> = [];
  Object.entries(parsedSettings).forEach(([key, value]) => {
    const isObject = (obj: any) => obj === Object(obj);
    const isArray = Array.isArray(value);
    const isObjectResult = !isArray && isObject(value);
    const isBooleanValue = isBoolean(value);
    const isNumber = Boolean(parseFloat(value)) || value === 0;
    const isString = isValidString(value) && !isNumber && !isBooleanValue && !isArray && !isObject;
    const isList = isArray && !isObjectResult && !isObject(value[0]);
    const isObjectList = isArray && isObject(value[0]);
    const setting: TSetting = {
      name: key,
      boolean: isBoolean(value),
      type: isObjectList
        ? 'objectList'
        : isObjectResult
          ? 'object'
          : isList
            ? 'list'
            : isNumber
              ? 'number'
              : isBooleanValue
                ? 'boolean'
                : 'string',
      list: isList ? value : null,
      object: isObjectResult ? value : null,
      string: isString ? value : null,
      number: isNumber ? value : null,
      objectList: isObjectList ? value : [],
    };
    deconstructedSettings.push(setting as T);
  });
  return deconstructedSettings;
};
