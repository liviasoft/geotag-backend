import { Request, Response } from 'express';

export const defaultHandler = async (req: Request, res: Response) => {
  return res.status(200).send({ message: 'Not yet implemented' });
};

export const notFoundHander = async (req: Request, res: Response) => {
  return res.status(404).send({ message: 'Route not found' });
};
