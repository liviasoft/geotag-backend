import { NextFunction, Request, Response } from 'express';

export const timeout = async (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(15000, () => {
    // Handle timeout error
    res.status(504).json({
      code: 504,
      status: 'Error',
      message: 'Gateway timeout.',
      data: null,
    });
    next(false); // Abort the request
  });

  next(); // Cont
};
