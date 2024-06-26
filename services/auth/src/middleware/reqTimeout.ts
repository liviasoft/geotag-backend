import { GatewayTimeout, TooManyRequests } from '@neoncoder/typed-service-response';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { TIME_IN_SECONDS, MILLISECONDS } from '../utils/constants';

export const timeout = async (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(1 * TIME_IN_SECONDS.minute * MILLISECONDS, () => {
    // Handle timeout error
    const sr = GatewayTimeout({});
    res.status(sr.statusCode).json(sr);
    next(false); // Abort the request
  });

  next(); // Cont
};

export const limiter = rateLimit({
  windowMs: 1 * TIME_IN_SECONDS.minute * MILLISECONDS, // 1 minutes in milliseconds
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: TooManyRequests({ message: 'Too many requests from this IP, please try again after 1 minute' }),
});
