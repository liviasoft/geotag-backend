import { NextFunction, Request, Response } from 'express';
import { TUserWithIncludes, UserPostgresService } from '../modules/postgres/user.pg';
import { TStatus } from '@neoncoder/typed-service-response';
import { User } from '@prisma/client';
import { RolePostgresService, TRoleWithIncludes } from '../modules/postgres/settings/roles.pg';
import {
  mergePermissions,
  mergeSpecialPermissions,
  serializeFeatureBans,
  serializePermissions,
  serializeRoles,
  serializeSpecialPermissions,
} from '../utils/helpers/serializers';
import { TRolePermissionWithInclude } from '../modules/postgres/settings/rolePermissions.pg';
import { TRoleSpecialPermissionWithInclude } from '../modules/postgres/settings/roleSpecialPermissions.pg';
import { TUserFeatureBanWithIncludes } from '../modules/postgres/settings/userFeatureBans.pg';

export const proxyRequestMeta = async (req: Request, res: Response, next: NextFunction) => {
  // NOTE: Best to use all lowercase property names for request headers
  const { scope, user, roles, settings, permissions, specialPermissions, featureBans } = res.locals;
  req.headers.user = user ? JSON.stringify(user) : '';
  req.headers.scope = scope ? JSON.stringify(scope) : '';
  req.headers.roles = roles ? JSON.stringify(roles) : '';
  req.headers.settings = settings ? JSON.stringify(settings) : '';
  req.headers.permissions = permissions ? JSON.stringify(permissions) : '';
  req.headers.specialpermissions = specialPermissions ? JSON.stringify(specialPermissions) : '';
  req.headers.featurebans = featureBans ? JSON.stringify(featureBans) : '';
  return next();
};

export const getUserIfLoggedIn = async (_: Request, res: Response, next: NextFunction) => {
  // const id = '';
  const id = 'tpw9m2dvcibu39u';

  const upgs = new UserPostgresService({});
  const rpgs = new RolePostgresService({});
  const result: TStatus<'user', User> = (
    await upgs.findById({
      id,
      include: {
        roles: {
          include: {
            permissions: { include: { resourceData: true }, orderBy: { resourceData: { name: 'asc' } } },
            specialPermissions: {
              include: { specialPermissionData: true },
              orderBy: { specialPermissionData: { name: 'asc' } },
            },
          },
        },
        resourcePermissions: { include: { resourceData: true }, orderBy: { resourceData: { name: 'asc' } } },
        featureBans: { include: { featureData: true } },
        specialPermissions: {
          include: { specialPermissionData: true },
          orderBy: { specialPermissionData: { name: 'asc' } },
        },
      },
    })
  ).result!;
  if (result.data?.user) {
    const {
      roles,
      resourcePermissions: userPermissions,
      featureBans,
      specialPermissions: userSpecialPermissions,
    } = result.data.user as TUserWithIncludes;
    const rolePermissions: TRolePermissionWithInclude[] = roles
      ? roles
          .filter((x: TRoleWithIncludes) => !!x.permissions)
          .flatMap((x: TRoleWithIncludes) => x.permissions as TRolePermissionWithInclude[])
      : [];
    const roleSpecialPermissions: TRoleSpecialPermissionWithInclude[] = roles
      ? roles.flatMap((x: TRoleWithIncludes) => x.specialPermissions as TRoleSpecialPermissionWithInclude[])
      : [];
    // console.log({ userPermissions, userSpecialPermissions, rolePermissions, roleSpecialPermissions, featureBans });
    const userPerms = serializePermissions(userPermissions!, true);
    const rolePerms = serializePermissions(rolePermissions!);
    const userSpecPerms = serializeSpecialPermissions(userSpecialPermissions!);
    const roleSpecPerms = serializeSpecialPermissions(roleSpecialPermissions!);
    res.locals = {
      ...res.locals,
      roles: serializeRoles(roles!),
      // userPerms,
      // rolePerms,
      // userSpecPerms,
      // roleSpecPerms,
      permissions: mergePermissions(userPerms, rolePerms),
      specialPermissions: mergeSpecialPermissions(userSpecPerms, roleSpecPerms),
      featureBans: serializeFeatureBans(featureBans as TUserFeatureBanWithIncludes[]),
    };
  } else {
    const guestResult: TStatus<'roles', TRoleWithIncludes> = (
      await rpgs.getFullList({
        filters: { AND: [{ active: true }, { isDefault: true }, { requiresAuth: false }] },
        include: {
          permissions: { include: { resourceData: true }, orderBy: { resourceData: { name: 'asc' } } },
          specialPermissions: {
            include: { specialPermissionData: true },
            orderBy: { specialPermissionData: { name: 'asc' } },
          },
        },
      })
    ).result!;
    const guestRoles: TRoleWithIncludes[] = guestResult.data!.roles! as TRoleWithIncludes[];
    const rolePermissions: TRolePermissionWithInclude[] = guestRoles
      ? guestRoles
          .filter((x: TRoleWithIncludes) => !!x.permissions)
          .flatMap((x: TRoleWithIncludes) => x.permissions as TRolePermissionWithInclude[])
      : [];
    const roleSpecialPermissions: TRoleSpecialPermissionWithInclude[] = guestRoles
      ? guestRoles.flatMap((x: TRoleWithIncludes) => x.specialPermissions as TRoleSpecialPermissionWithInclude[])
      : [];
    const roles = serializeRoles(guestRoles as TRoleWithIncludes[]);
    res.locals = {
      ...res.locals,
      roles,
      permissions: serializePermissions(rolePermissions),
      specialPermissions: serializeSpecialPermissions(roleSpecialPermissions),
    };
  }
  res.locals.user = result.data?.user;
  next();
};
