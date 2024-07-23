import { Request, Response } from 'express';
import { UserPostgresService } from '../../modules/postgres/user.pg';
import { Role, User } from '@prisma/client';
import { ServiceEvent, statusTypes } from '@neoncoder/typed-service-response';
import { RolePostgresService } from '../../modules/postgres/settings/roles.pg';
import { UserPocketbaseService } from '../../modules/pocketbase/user.pb';
import { User as PBUser } from '../../lib/pocketbase.types';
import { generateOTP } from '../../utils/helpers/veritication.utils';
import CacheService from '../../modules/cache';
import { TVerificationData } from '../../utils/helpers/custom.types';
import { TIME_IN_SECONDS } from '../../utils/constants';
import { getServiceQueues } from '../../lib/redis';
import { sendToQueues } from '../../lib/rabbitmq';
import { config } from '../../config/config';
import { events } from '../../events/eventTypes';
import { PhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';

export const emailSignupHandler = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const { settings } = res.locals;
  const userpgs = new UserPostgresService({});
  const check = (
    await userpgs.findFirst({
      filters: {
        OR: [
          { email: { mode: 'insensitive', equals: email } },
          { username: { mode: 'insensitive', equals: username } },
        ],
      },
    })
  ).result!;
  console.log({ existing: check });
  if (check.data?.user) {
    const { email: existingEmail, username: existingUsername } = check.data.user as User;
    const sr = statusTypes.get('BadRequest')!({});
    sr.message = existingEmail === email ? `${email} is already registered` : `Username @${username} is already taken`;
    sr.error = {
      email: existingEmail === email ? `${email} is already registered` : null,
      username:
        existingUsername?.toLowerCase() === username.toLowerCase() ? `@${username} is already registered` : null,
    };
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
  const sr = statusTypes.get(result.statusType)!({
    ...result,
    message: result.statusType === 'OK' ? 'Signup Successful' : result.message,
  });
  return res.status(sr.statusCode).send(sr);
};

export const phoneSignupHandler = async (req: Request, res: Response) => {
  const { phoneCode, username, password, phone } = req.body;
  const { settings } = res.locals;
  let parsedNumber: PhoneNumber | undefined;
  try {
    parsedNumber = parsePhoneNumberWithError(phone, phoneCode);
  } catch (error: any) {
    console.log({ error });
    const sr = statusTypes.get('BadRequest')!({
      message: 'Invalid Phone Number',
      error: { phone: 'Invalid Phone Number', details: error },
    });
    return res.status(sr.statusCode).send(sr);
  }
  const userpgs = new UserPostgresService({});
  const check = (
    await userpgs.findFirst({
      filters: {
        OR: [
          { phone: { mode: 'insensitive', equals: parsedNumber.number } },
          { username: { mode: 'insensitive', equals: username } },
        ],
      },
    })
  ).result!;
  console.log({ exists: check.data });
  if (check.data?.user) {
    const { phone: existingPhone, username: existingUsername } = check.data.user as User;
    const sr = statusTypes.get('BadRequest')!({});
    sr.message =
      existingPhone === parsedNumber.number
        ? `${parsedNumber.number} is already registered`
        : `Username @${username} is already taken`;
    sr.error = {
      phone: existingPhone === parsedNumber.number ? `${parsedNumber.number} is already registered` : null,
      username:
        existingUsername?.toLowerCase() === username.toLowerCase() ? `@${username} is already registered` : null,
    };
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
    phone: parsedNumber.number,
    phoneData: parsedNumber,
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
    const verifData: TVerificationData = { id, phone: parsedNumber.number, OTP, type: 'PHONE', expiresIn };
    const cacheService = await new CacheService()
      .formatKey({ scopeToService: false }, 'OTP', 'PHONE', user.id)
      .set(verifData, undefined, { EX: expiresIn });
    const serviceQueues = await getServiceQueues(['comms']);
    const authEvents = (await cacheService.hGet(config.self.name, 'events', { scopeToService: false }))
      .result! as typeof events;
    const userRegisteredEvent = new ServiceEvent({
      type: authEvents.USER_SIGNED_UP_VIA_PHONE,
      origin: config.self.name,
      data: { user },
      serviceQueues,
      eventId: `${authEvents.USER_SIGNED_UP_VIA_PHONE}-${user.id}`,
    });
    await sendToQueues({ services: serviceQueues, message: userRegisteredEvent });
  }
  const sr = statusTypes.get(result.statusType)!({
    ...result,
    message: result.statusType === 'OK' ? 'Signup Successful' : result.message,
  });
  return res.status(sr.statusCode).send(sr);
};

export const getSignupOptionsHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Phone Login Not yet implemented' });
  return res.status(sr.statusCode).send(sr);
};
