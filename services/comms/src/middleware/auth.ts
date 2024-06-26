import { Request, Response, NextFunction } from 'express';

export const getProxyMeta = async (req: Request, res: Response, next: NextFunction) => {
  // NOTE: use all lowercase property names to retrieve request headers
  if (req.headers.user) res.locals.user = JSON.parse(req.headers.user as string);
  if (req.headers.scope) res.locals.scope = JSON.parse(req.headers.scope as string);
  if (req.headers.roles) res.locals.roles = JSON.parse(req.headers.roles as string);
  if (req.headers.settings) res.locals.settings = JSON.parse(req.headers.settings as string);
  if (req.headers.permissions) res.locals.permissions = JSON.parse(req.headers.permissions as string);
  if (req.headers.specialpermissions) {
    res.locals.specialPermissions = JSON.parse(req.headers.specialpermissions as string);
  }
  if (req.headers.featurebans) res.locals.featureBans = JSON.parse(req.headers.featurebans as string);
  // console.log({ specialPermissions: req.headers.specialpermissions });
  // console.log({ featureBans: res.locals.featureBans });
  console.log(res.locals);
  res.locals.params = {};
  next();
};
