import { ServiceResponse, statusTypes } from '@neoncoder/typed-service-response';
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';

export const zodValidate =
  (schema: AnyZodObject, schemaName: string) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      const errorFields: { [key: string]: any } = {};
      const sr: ServiceResponse<any> = statusTypes.get('BadRequest')!({
        message: `${schemaName} validation failed`,
      });
      if (error instanceof ZodError) {
        const details = error['issues'].map(({ path, message, code }: ZodIssue) => ({
          field: path[path.length - 1],
          code,
          path,
          message,
        }));
        details.forEach((d) => {
          errorFields[d.field] = d.message;
        });
        sr.error = { ...errorFields, details };
      } else {
        sr.error = error;
      }
      return res.status(sr.statusCode).send(sr);
    }
  };
