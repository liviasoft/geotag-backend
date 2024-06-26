import { NextFunction, Request, Response } from 'express';
import { MessageTemplatePostgresService } from '../modules/postgres/messageTemplates.pg';
import { Rez, TStatus } from '@neoncoder/typed-service-response';
import { MessageTemplate } from '@prisma/client';

export const checkMessageTemplateExists = async (
  _: Request,
  res: Response,
  next: NextFunction,
  messageTemplateName: string,
) => {
  const result = (await new MessageTemplatePostgresService({}).findFirst({ filters: { name: messageTemplateName } }))
    .result! as TStatus<'messageTemplate', MessageTemplate>;
  if (!result.data?.messageTemplate) {
    const sr = Rez[result.statusType]({ ...result });
    return res.status(sr.statusCode).send(sr);
  }
  res.locals.params['messageTemplate'] = result.data.messageTemplate;
  return next();
};
