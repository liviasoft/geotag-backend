import { TStatus } from '@neoncoder/typed-service-response';
import { AppSettingsPostgresService } from './appSettings.pg';
import { AppSetting } from '@prisma/client';
import { Response } from 'express';
import { constructSettings } from '../../../utils/helpers/serializers';

export const getAppSettings = async (res?: Response) => {
  if (res?.locals.settings) return res.locals.settings;
  const aspgs = new AppSettingsPostgresService({});
  const result: TStatus<'appSettings', AppSetting> = (await aspgs.getFullList({})).result!;
  if (!result.data?.appSettings) return {};
  const settings: { [key: string]: any } = constructSettings<AppSetting>(result.data.appSettings as AppSetting[]);
  return settings;
};
