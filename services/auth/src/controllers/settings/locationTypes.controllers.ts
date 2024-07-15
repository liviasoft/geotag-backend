import { Request, Response } from 'express';
import { LocationTypePostgresService } from '../../modules/postgres/locationType.pg';
import { Rez } from '@neoncoder/typed-service-response';

export const getLocationTypesHandler = async (req: Request, res: Response) => {
  const ltpgs = new LocationTypePostgresService({});
  const result = (await ltpgs.getFullList({})).result!;
  const sr = Rez[result.statusType]!({ ...result });
  return res.status(sr.statusCode).send(sr);
};
