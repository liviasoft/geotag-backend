import { Request, Response } from 'express';
import { UserPostgresService } from '../modules/postgres/user.pg';
import { Role, User } from '@prisma/client';
// import { Rez, ServiceEvent, statusTypes } from '@neoncoder/typed-service-response';
import { Rez, ServiceEvent, statusTypes } from '@neoncoder/typed-service-response';
import { RolePostgresService } from '../modules/postgres/settings/roles.pg';
import { UserPocketbaseService } from '../modules/pocketbase/user.pb';
import { User as PBUser } from '../lib/pocketbase.types';
import { generateOTP } from '../utils/helpers/veritication.utils';
import CacheService from '../modules/cache';
import { TVerificationData } from '../utils/helpers/custom.types';
import { TIME_IN_SECONDS } from '../utils/constants';
import { getServiceQueues } from '../lib/redis';
// import { config } from '../utils/config';
import { sendToQueues } from '../lib/rabbitmq';
import { config } from '../utils/config';
import { events } from '../events/eventTypes';

export const emailSignupHandler = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const { settings } = res.locals;
  const userpgs = new UserPostgresService({});
  const check = (
    await userpgs.findFirst({ filters: { OR: [{ email }, { username: { mode: 'insensitive', equals: username } }] } })
  ).result!;
  if (check.data?.user) {
    const { email: existingEmail } = check.data.user as User;
    const sr = statusTypes.get('BadRequest')!({});
    sr.message = existingEmail === email ? `${email} is already registered` : `Username ${username} is already taken`;
    return res.status(sr.statusCode).send(sr);
  }
  const defaultRoles: string[] = (
    (
      await new RolePostgresService({}).getFullList({
        filters: { AND: [{ active: true }, { isDefault: true }, { requiresAuth: true }] },
      })
    ).result!.data!.roles as Role[]
  ).map(({ id }) => id);
  const userData: Partial<PBUser> = {
    email,
    username,
    password,
    passwordConfirm: password,
    roles: defaultRoles,
    emailVisibility: true,
    verified: !settings?.REQUIRE_VERIFICATION_ON_SIGNUP,
  };
  const userpbs = new UserPocketbaseService({ isAdmin: true });
  const result = (await userpbs.createUser({ createData: userData })).result!;
  // SECTION: App Settings  for verification
  if (settings?.REQUIRE_VERIFICATION_ON_SIGNUP && result.statusType === 'OK') {
    const user = result.data!.user as PBUser;
    const OTP = generateOTP();
    const { id } = user;
    const expiresIn = 1 * TIME_IN_SECONDS.hour;
    const verifData: TVerificationData = { id, email, OTP, type: 'EMAIL', expiresIn };
    const cacheService = await new CacheService()
      .formatKey({ scopeToService: false }, 'OTP', 'EMAIL', user.id)
      .set(verifData, undefined, { EX: expiresIn });
    const serviceQueues = await getServiceQueues(['comms']);
    const authEvents = (await cacheService.hGet(config.self.name, 'events', { scopeToService: false }))
      .result! as typeof events;
    const userRegisteredEvent = new ServiceEvent({
      type: authEvents.USER_SIGNED_UP_VIA_EMAIL,
      origin: config.self.name,
      data: { user },
      serviceQueues,
      eventId: `${authEvents.USER_SIGNED_UP_VIA_EMAIL}-${user.id}`,
    });
    await sendToQueues({ services: serviceQueues, message: userRegisteredEvent });
  }
  const sr = statusTypes.get(result.statusType)!({ ...result });
  return res.status(sr.statusCode).send(sr);
};

export const phoneSignupHandler = async (req: Request, res: Response) => {
  const sr = Rez.OK({ message: 'Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
