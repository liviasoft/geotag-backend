import { NextFunction, Request, Response } from 'express';

export const addRequestMeta = async (req: Request, res: Response, next: NextFunction) => {
  console.log({ body: req.body });
  res.locals.meta = {
    user: {
      name: 'John',
      age: 10,
    },
  };
  req.body = {
    ...req.body,
    meta: {
      user: {
        name: 'John',
        age: 10,
      },
    },
  };
  console.log({ body: req.body });
  return next(); // Cont
};
