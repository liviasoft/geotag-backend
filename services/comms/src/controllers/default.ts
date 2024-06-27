import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { OK, NotFound, statusTypes, CustomError, statusCodes } from '@neoncoder/typed-service-response';
import { getPrismaClient } from '../lib/prisma';
import CacheService from '../modules/cache';
import { getAppSettings } from '../modules/postgres/settings/utils';
// import { MessagingService } from '../services/Message.service';
// import { fakerMessageDefaults } from '../utils/helpers/fakerDefaults';

export const defaultHandler = async (req: Request, res: Response) => {
  const settings = await getAppSettings(res);
  try {
    // const messenger = new MessagingService(['EMAIL'], settings);
    // await messenger.prepareTemplate('USER_SIGNUP_VERIFICATION_CODE');
    // await messenger.sendMessage(fakerMessageDefaults, res.locals.user, {
    //   EMAIL: { to: 'unique11@ethereal.email', subject: 'Hello from nodemailer' },
    // });

    // console.log({ messenger, email: messenger.senders.EMAIL, sms: messenger.senders.SMS });
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: 'unique11@ethereal.email',
        pass: '2fZx8QPhSRyEVhm1K5',
      },
    });
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch 👻" <unique11@ethereal.email>', // sender address
      to: 'unique11@ethereal.email', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world?', // plain text body
      html: '<b>Hello world?</b>', // html body
    });
    console.log({ info });
    const sr = OK({ message: 'Not yet implemented', data: { meta: settings } });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    if (error instanceof CustomError) {
      console.log({ error });
      const result = statusCodes.get(error.code)!({
        error,
        statusCode: error.code,
        statusType: error.statusType,
        message: error.name,
        errMessage: error.message,
      });
      return res.status(result.statusCode).send(result);
    }
  }
};

export const notFoundHander = async (req: Request, res: Response) => {
  const sr = NotFound({});
  return res.status(sr.statusCode).send(sr);
};

export const healthCheckHandler = async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestame: Date.now(),
    postgres: 'disconnected',
    redis: 'disconnected',
  };

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    const redis = await new CacheService().connect();
    healthCheck.postgres = 'connected';
    healthCheck.redis = redis.client.isReady ? 'connected' : 'disconnected';
    await redis.disconnect();
    const sr = statusTypes.get('OK')!({ message: healthCheck.message, data: { health: { ...healthCheck } } });
    return res.status(sr.statusCode).send(sr);
  } catch (error: any) {
    const sr = statusTypes.get('InternalServerError')!({ error });
    return res.status(sr.statusCode).send(sr);
  }
};
