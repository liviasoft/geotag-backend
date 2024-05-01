import { GatewayTimeout } from '@neoncoder/service-response';
import { NextFunction, Request, Response } from 'express';

export const timeout = async (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(15000, () => {
    // Handle timeout error
    const sr = GatewayTimeout({});
    res.status(sr.statusCode).json(sr);
    next(false); // Abort the request
  });

  next(); // Cont
};
