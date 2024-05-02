import { Request, Response, NextFunction } from 'express';

export const getProxyMeta = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.meta) {
    res.locals = req.body.meta;
    delete req.body.meta;
  }
  console.log({ locals: res.locals });
  next();
};
