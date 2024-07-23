import { Request, Response } from 'express';
import { ServiceEvent, TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { UserPostgresService } from '../../modules/postgres/user.pg';
import { getPocketBase } from '../../lib/pocketbase';
import { config } from '../../config/config';
import { getPrismaClient } from '../../lib/prisma';
import { Session } from '@prisma/client';
import { signJWT } from '../../utils/helpers/veritication.utils';
import { User } from '../../lib/pocketbase.types';
import CacheService from '../../modules/cache';
import { getServiceQueues } from '../../lib/redis';
import { events } from '../../events/eventTypes';
import { sendToQueues } from '../../lib/rabbitmq';

export const emailLoginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const uspgs = new UserPostgresService({});
  const check = (
    await uspgs.findFirst({
      filters: { email: { equals: email } },
      include: {
        roles: { include: { permissions: true, specialPermissions: true } },
        resourcePermissions: true,
        featureBans: true,
        specialPermissions: true,
      },
    })
  ).result! as TStatus<'user'>;
  if (!check?.data?.user) {
    const sr = statusTypes.get('NotFound')!({
      message: `This email is not registered`,
      error: { email: `${email} is not registered` },
    });
    return res.status(sr.statusCode).send(sr);
  }
  const adminpb = getPocketBase(true);
  let pbToken: string;
  let pbUser: User;
  try {
    const userpb = getPocketBase();
    const { token, record } = await userpb.collection('users').authWithPassword(email, password);
    pbToken = token;
    pbUser = record;
  } catch (error: any) {
    console.log({ error });
    const sr = statusTypes.get('BadRequest')!({
      message: `Incorrect email and password`,
      error: { password: `Incorrect email and password`, details: error },
    });
    return res.status(sr.statusCode).send(sr);
  }
  await adminpb.admins.authWithPassword(config.pocketbase.adminEmail, config.pocketbase.adminPassword);
  const refreshTokenTTLInSeconds = Math.floor((await adminpb.settings.getAll()).recordAuthToken.duration / 1000) * 1000;
  console.log({ pbToken, pbUser });
  const db = getPrismaClient();
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
  console.log({ ip });
  const session = (
    await uspgs.sessionService.create({
      loginType: 'EMAIL',
      ip,
      user: pbUser.id,
      expiresAt: new Date(Date.now() + refreshTokenTTLInSeconds * 1000),
    })
  ).result! as TStatus<'session', Session>;
  if (!session?.data?.session) {
    const sr = statusTypes.get('InternalServerError')!({
      message: `Server Error: Please try again later or contact support`,
      error: `Error creating user login session`,
    });
    return res.status(sr.statusCode).send(sr);
  }
  const newSession = session.data.session as Session;
  console.log({ newSession });
  db.location.findFirst({ where: { city: { path: ['id'], equals: '1234' } } });
  console.log({ pbSettings: (await adminpb.settings.getAll()).recordAuthToken.duration, password });
  const { csrfToken } = newSession;
  const tokenData = { userId: pbUser.id, sessionId: newSession.id, pbToken, csrfToken };
  console.log({ tokenData });
  const { token: accessToken, error: accessTokenError } = signJWT(tokenData, undefined, {
    expiresIn: config.self.accessTokenTTL,
  });
  const { token: refreshToken, error: refreshTokenError } = signJWT(tokenData, undefined, {
    expiresIn: refreshTokenTTLInSeconds * 1000,
  });
  if (accessTokenError || refreshTokenError) {
    const sr = statusTypes.get('InternalServerError')!({ message: 'Error generating user tokens' });
    return res.status(sr.statusCode).send(sr);
  }
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: refreshTokenTTLInSeconds * 1000,
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    maxAge: parseInt(String(config.self.accessTokenTTLMS), 10),
  });
  const loggedInUser = check.data.user;
  const cacheService = await new CacheService()
    .formatKey({ scopeToService: false }, 'SESSION', loggedInUser.id, newSession.id)
    .set(tokenData, undefined, { EX: parseInt(String(config.self.accessTokenTTLMS), 10) / 1000 });
  const serviceQueues = await getServiceQueues([]);
  const authEvents = (await cacheService.hGet(config.self.name, 'events', { scopeToService: false }))
    .result! as typeof events;
  const userLoggedInEvent = new ServiceEvent({
    type: authEvents.USER_LOGGED_IN,
    origin: config.self.name,
    data: { user: pbUser },
    serviceQueues,
    eventId: `${authEvents.USER_LOGGED_IN}-${pbUser.id}`,
  });
  await sendToQueues({ services: serviceQueues, message: userLoggedInEvent });
  const sr = statusTypes.get('OK')!({
    message: `Login Successful - Welcome back ${check.data.user.username}`,
    data: { user: loggedInUser, meta: { accessToken, refreshToken, csrfToken } },
  });
  return res.status(sr.statusCode).send(sr);
};

export const phoneLoginHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Phone Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const usernameLoginHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Username Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};

export const getLoginOptionsHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Phone Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
