import { Request, Response } from 'express';
import { OK, NotFound } from '@neoncoder/service-response';

export const defaultHandler = async (req: Request, res: Response) => {
  const sr = OK({ message: 'Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const notFoundHander = async (req: Request, res: Response) => {
  const sr = NotFound({});
  return res.status(sr.statusCode).send(sr);
};
