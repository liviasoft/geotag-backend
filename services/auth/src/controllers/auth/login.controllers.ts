import { Request, Response } from 'express';
import { TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { UserPostgresService } from '../../modules/postgres/user.pg';
import { getPocketBase } from '../../lib/pocketbase';
import { config } from '../../config/config';
import { getPrismaClient } from '../../lib/prisma';

export const emailLoginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const uspgs = new UserPostgresService({});
  const check = (await uspgs.findFirst({ filters: { email: { equals: email } } })).result! as TStatus<'user'>;
  if (!check?.data?.user) {
    const sr = statusTypes.get('NotFound')!({ message: `This email is not registered` });
    return res.status(sr.statusCode).send(sr);
  }
  const pb = getPocketBase(true);
  const db = getPrismaClient();
  db.location.findFirst({ where: { city: { path: ['id'], equals: '1234' } } });
  await pb.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword);
  console.log({ pbSettings: (await pb.settings.getAll()).adminAuthToken, password });
  const sr = statusTypes.get('OK')!({ message: 'Email Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const phoneLoginHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Phone Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const usernameLoginHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Username Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const getLoginOptionsHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Phone Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
