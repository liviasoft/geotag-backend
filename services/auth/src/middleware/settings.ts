import { NextFunction, Request, Response } from 'express';
import { AppSettingsPostgresService } from '../modules/postgres/settings/appSettings.pg';
import { TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { AppSetting, Scope } from '@prisma/client';
import { ScopePostgresService } from '../modules/postgres/settings/scopes.pg';
import { constructSettings, serializeScope } from '../utils/helpers/serializers';

export const getAppSettings = async (_: Request, res: Response, next: NextFunction) => {
  const aspgs = new AppSettingsPostgresService({});
  const result: TStatus<'appSettings', AppSetting> = (await aspgs.getFullList({})).result!;
  if (!result.data?.appSettings) return next();
  const settings: { [key: string]: any } = constructSettings<AppSetting>(result.data.appSettings as AppSetting[]);
  res.locals.settings = settings;
  next();
};

export const getAppScopes = async (_: Request, res: Response, next: NextFunction) => {
  const spgs = new ScopePostgresService({});
  const result: TStatus<'scopes', Scope> = (
    await spgs.getFullList({ include: { features: { include: { featureFlags: true } } } })
  ).result!;
  if (!result.data?.scopes) return next();
  const scopes: Scope[] = result.data.scopes as Scope[];
  res.locals.scopes = scopes.map(serializeScope);
  next();
};

export const scope = (scope: string) => {
  return async (_: Request, res: Response, next: NextFunction) => {
    const spgs = new ScopePostgresService({});
    const result = (
      await spgs.findFirst({
        filters: { name: { startsWith: scope, mode: 'insensitive' } },
        include: { features: { include: { featureFlags: true } } },
      })
    ).result!;
    const service = result.data?.scope as Scope;
    if (!service || !service.active) {
      const message = !service ? 'This Service is not registered' : `${scope} Service temporarily deactivated`;
      const sr = statusTypes.get('ServiceUnavailable')!({ message });
      return res.status(sr.statusCode).send(sr);
    }
    res.locals.scope = serializeScope(service);
    next();
  };
};
