import { NextFunction, Request, Response } from 'express';
import { TUserWithIncludes, UserPostgresService } from '../modules/postgres/user.pg';
import { TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { Session, User } from '@prisma/client';
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
import { signJWT, verifyToken } from '../utils/helpers/veritication.utils';
import CacheService from '../modules/cache';
import { JwtPayload } from 'jsonwebtoken';
import { SessionPostgresService } from '../modules/postgres/session.pg';
import { config } from '../config/config';

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

export const validateAuthTokens = async (req: Request, res: Response, next: NextFunction) => {
  const cacheService = new CacheService();
  console.log({ requestData: req.body });
  const token = req.headers.authorization;
  if (!token) {
    res.locals.authUserId = null;
    return next();
    // const refreshToken = req.cookies?.refreshToken ? req.cookies.refreshToken : req.headers['x-refresh-token'];
    // if (!refreshToken) {
    //   res.locals.authUserId = null;
    //   return next();
    // }
    // const { decoded: refreshDecoded } = verifyToken(refreshToken);
    // console.log({ refreshDecoded });
    // if (!refreshDecoded) {
    //   res.locals.authUserId = null;
    //   return next();
    // }
  }
  const accessToken = token.split(' ')[1];
  const refreshToken = req.cookies?.refreshToken ? req.cookies.refreshToken : req.headers['x-refresh-token'];
  if (!accessToken) {
    res.locals.authUserId = null;
    return next();
  }
  const { decoded: accessDecoded, valid, expired } = verifyToken(accessToken);
  if (accessDecoded && valid) {
    const { userId, sessionId, pbToken, csrfToken } = accessDecoded as JwtPayload as {
      userId: string;
      sessionId: string;
      pbToken: string;
      csrfToken: string;
    };
    const sessionData = (await cacheService.formatKey({ scopeToService: false }, 'SESSION', userId, sessionId).get())
      .result;
    console.log({ sessionData });
    if (!sessionData) {
      res.locals.authUserId = null;
      return next();
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const { csrfToken: clientToken } = req.body;
      if (clientToken !== csrfToken || clientToken !== sessionData.csrfToken) {
        const sr = statusTypes.get('MethodNotAllowed')!({ message: `Invalid CSRF Token` });
        return res.status(sr.statusCode).send(sr);
      }
    }
    if (userId === sessionData.userId && sessionId === sessionData.sessionId && csrfToken === sessionData.csrfToken) {
      res.locals.authUserId = sessionData.userId;
      res.locals.authPBToken = pbToken;
      return next();
    }
    return next();
  }
  console.log({ refreshToken, expired });
  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken(refreshToken);
    if (!newAccessToken || !newAccessToken?.token) {
      res.locals.authUserId = null;
      return next();
    }
    const { userId, pbToken } = verifyToken(newAccessToken.token).decoded as { userId: string; pbToken: string };

    res.locals.newAccessToken = newAccessToken?.token;
    res.locals.authUserId = userId;
    res.locals.authPBToken = pbToken;
    return next();
  }
};

export const getUserIfLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  // let id = 'tpw9m2dvcibu39u';
  const id = res.locals.authUserId;
  const upgs = new UserPostgresService({});
  const rpgs = new RolePostgresService({});
  if (id) {
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
    if (result && result.data?.user) {
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
      res.locals.user = result.data?.user;
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
  next();
};

export const reIssueAccessToken = async (refreshToken: string) => {
  const tokenData = verifyToken(refreshToken).decoded as {
    userId: string;
    sessionId: string;
    pbToken: string;
    csrfToken: string;
  };

  if (!tokenData || !tokenData?.sessionId) return false;

  const result = (await new SessionPostgresService({}).findById({ id: tokenData?.sessionId })).result as TStatus<
    'session',
    Session
  >;

  if (!result || !result.data?.session) return false;

  const session = result.data.session as Session;

  if (!session.expiresAt) return false;

  if (new Date(session.expiresAt).getTime() < Date.now()) return false;

  if (tokenData.userId !== session.user) return false;

  const newTokenData = {
    userId: session.user,
    sessionId: session.id,
    pbToken: tokenData.pbToken,
    csrfToken: session.csrfToken,
  };
  const newAccessToken = signJWT(newTokenData, undefined, { expiresIn: config.self.accessTokenTTL });

  return newAccessToken;
};

export const requireLoggedInUser = async (_: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (!user) {
    const sr = statusTypes.get('Unauthorized')!({ message: `You need to be logged in` });
    return res.status(sr.statusCode).send(sr);
  }

  return next();
};
