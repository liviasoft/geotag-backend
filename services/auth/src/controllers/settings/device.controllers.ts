import { Request, Response } from 'express';
import { DeviceCommandPostgresService } from '../../modules/postgres/deviceCommand.pg';
import { statusTypes, TStatus } from '@neoncoder/typed-service-response';
import { NextFunction } from 'http-proxy-middleware/dist/types';

export const getDeviceCommandsHandler = async (req: Request, res: Response) => {
  const dcpgs = new DeviceCommandPostgresService({});
  const result = (await dcpgs.getFullList({ orderBy: { command: 'asc' } })).result! as TStatus<'deviceCommands'>;
  const sr = statusTypes.get(result.statusType)!({ ...result, newAccessToken: res.locals.newAccessToken });
  return res.status(sr.statusCode).send(sr);
};

export const addDeviceCommandHandler = async (req: Request, res: Response) => {
  const dcpgs = new DeviceCommandPostgresService({});
  const result = (await dcpgs.create(req.body)).result! as TStatus<'deviceCommand'>;
  const sr = statusTypes.get(result.statusType)!({ ...result, newAccessToken: res.locals.newAccessToken });
  return res.status(sr.statusCode).send(sr);
};

export const updateDeviceCommandsHandler = async (req: Request, res: Response) => {
  const dcpgs = new DeviceCommandPostgresService({ deviceCommand: res.locals.deviceCommand });
  const result = (await dcpgs.update(req.body)).result! as TStatus<'deviceCommand'>;
  const sr = statusTypes.get(result.statusType)!({ ...result, newAccessToken: res.locals.newAccessToken });
  return res.status(sr.statusCode).send(sr);
};

export const deleteDeviceCommandsHandler = async (_: Request, res: Response) => {
  const dcpgs = new DeviceCommandPostgresService({ deviceCommand: res.locals.deviceCommand });
  const result = (await dcpgs.delete()).result! as TStatus<'deviceCommand'>;
  const sr = statusTypes.get(result.statusType)!({ ...result, newAccessToken: res.locals.newAccessToken });
  return res.status(sr.statusCode).send(sr);
};

export const deviceCommandExists = async (req: Request, res: Response, next: NextFunction, deviceCommandId: string) => {
  const dcpgs = new DeviceCommandPostgresService({});
  const result = (await dcpgs.findById({ id: deviceCommandId })).result! as TStatus<'deviceCommand'>;
  if (!result.data?.deviceCommand) {
    const sr = statusTypes.get(result.statusType)!({ ...result });
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.deviceCommand = result.data.deviceCommand;
  return next();
};
