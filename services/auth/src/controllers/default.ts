import { Request, Response } from 'express';
import { OK, NotFound, Rez, statusTypes } from '@neoncoder/typed-service-response';
import { getPocketBase } from '../lib/pocketbase';
import { getPrismaClient } from '../lib/prisma';
import CacheService from '../modules/cache';
// import { UserPocketbaseService } from '../modules/pocketbase/user.pb';

export const defaultHandler = async (_: Request, res: Response) => {
  // const upbs = new UserPocketbaseService({ isAdmin: true });
  // const userId = 'tpw9m2dvcibu39u';
  // const test = (await upbs.getUsers({ options: { expand: 'roles', filter: `id='${userId}'` } })).result;
  // console.log({ test });
  const {
    scope,
    scopes,
    // user,
    roles,
    settings,
    // userPerms,
    // rolePerms,
    // userSpecPerms,
    // roleSpecPerms,
    permissions,
    specialPermissions,
    featureBans,
  } = res.locals;
  // if (user) {
  //   delete user.roles;
  //   delete user.resourcePermissions;
  //   delete user.specialPermissions;
  //   delete user.featureBans;
  // }
  const sr = OK({
    message: 'Not yet implemented',
    data: {
      meta: {
        // test,
        // roles,
        // userPerms,
        // rolePerms,
        // userSpecPerms,
        // roleSpecPerms,
        settings,
        // permissions,
        // specialPermissions,
        // featureBans,
        // user,
        asString: {
          roles: JSON.stringify({ ...roles }),
          featureBans: JSON.stringify({ ...featureBans }),
          specialPermissions: JSON.stringify({ ...specialPermissions }),
          permissions: JSON.stringify({ ...permissions }),
          // settings: JSON.stringify({ ...settings }),
          scope: JSON.stringify({ ...scope }),
          // user: JSON.stringify({ ...user }),
        },
        // scope,
        scopes,
      },
    },
  });
  return res.status(sr.statusCode).send(sr);
};

export const placeholderHandler = async (_: Request, res: Response) => {
  const sr = Rez.OK({ message: 'Not yet implemented', data: { meta: getPocketBase(true).settings.getAll({}) } });
  return res.status(sr.statusCode).send(sr);
};

export const notFoundHander = async (req: Request, res: Response) => {
  const sr = NotFound({});
  return res.status(sr.statusCode).send(sr);
};

export const healthCheckHandler = async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestame: Date.now(),
    pocketbase: {},
    postgres: 'disconnected',
    redis: 'disconnected',
  };

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    const redis = await new CacheService().connect();
    healthCheck.postgres = 'connected';
    healthCheck.redis = redis.client.isReady ? 'connected' : 'disconnected';
    healthCheck.pocketbase = await getPocketBase(true).health.check({});
    await redis.disconnect();
    const sr = statusTypes.get('OK')!({ message: healthCheck.message, data: { health: { ...healthCheck } } });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    const sr = statusTypes.get('InternalServerError')!({ error });
    return res.status(sr.statusCode).send(sr);
  }
};
