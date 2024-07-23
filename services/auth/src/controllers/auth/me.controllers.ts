import { statusTypes } from '@neoncoder/typed-service-response';
import { Request, Response } from 'express';

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Get Current User Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const logoutHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Logout user not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
