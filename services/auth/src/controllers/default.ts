import { Request, Response } from 'express';
import { OK, NotFound } from '@neoncoder/typed-service-response';

export const defaultHandler = async (_: Request, res: Response) => {
  const {
    scope,
    scopes,
    user,
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
  if (user) {
    delete user.roles;
    delete user.resourcePermissions;
    delete user.specialPermissions;
    delete user.featureBans;
  }
  const sr = OK({
    message: 'Not yet implemented',
    data: {
      meta: {
        roles,
        // userPerms,
        // rolePerms,
        // userSpecPerms,
        // roleSpecPerms,
        settings,
        permissions,
        specialPermissions,
        featureBans,
        user,
        asString: {
          roles: JSON.stringify({ ...roles }),
          featureBans: JSON.stringify({ ...featureBans }),
          specialPermissions: JSON.stringify({ ...specialPermissions }),
          permissions: JSON.stringify({ ...permissions }),
          settings: JSON.stringify({ ...settings }),
          scope: JSON.stringify({ ...scope }),
          user: JSON.stringify({ ...user }),
        },
        scope,
        scopes,
      },
    },
  });
  return res.status(sr.statusCode).send(sr);
};

export const notFoundHander = async (req: Request, res: Response) => {
  const sr = NotFound({});
  return res.status(sr.statusCode).send(sr);
};
