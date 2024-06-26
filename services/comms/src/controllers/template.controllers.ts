import { Request, Response } from 'express';
import { statusTypes } from '@neoncoder/typed-service-response';
import { MessageTemplatePostgresService } from '../modules/postgres/messageTemplates.pg';
import { compile } from 'handlebars';
import { MessageTemplate } from '@prisma/client';
import { fakerMessageDefaults as fakerDefaults } from '../utils/helpers/fakerDefaults';

export const getMessageTemplatesHandler = async (req: Request, res: Response) => {
  const result = (await new MessageTemplatePostgresService({}).getFullList({})).result!;
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const testMessageTemplateHandler = async (req: Request, res: Response) => {
  const messageTemplate = res.locals.params?.messageTemplate as MessageTemplate;
  const { requiredFields, emailTemplate, smsTemplate, pushNotificationTemplate: push } = messageTemplate;
  const data: { [key: string]: any } = {};
  requiredFields.forEach((field) => {
    if (fakerDefaults[field as keyof typeof fakerDefaults])
      data[field] = fakerDefaults[field as keyof typeof fakerDefaults];
  });
  try {
    const emailT = compile(emailTemplate);
    const smsT = compile(smsTemplate);
    const pushT = compile(push);
    const message = {
      requiredFields,
      email: emailT(data),
      sms: smsT(data),
      push: pushT(data),
      data,
    };
    const sr = statusTypes.get('OK')!({ data: { message } });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    console.log({ error });
    const sr = statusTypes.get('BadRequest')!({ error });
    return res.status(sr.statusCode).send(sr);
  }
};

export const messageTemplatePreviewHandler = async (req: Request, res: Response) => {
  if (req.method === 'POST') {
    const sr = statusTypes.get('OK')!({ message: 'Message Preview with post content- Not yet implemented' });
    return res.status(sr.statusCode).send(sr);
  }
  const sr = statusTypes.get('OK')!({ message: 'Message Preview with fakerJS content - Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
