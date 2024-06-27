import { ServiceEvent, ServiceResponse, TStatus, statusTypes } from '@neoncoder/typed-service-response';
import { getAppSettings } from '../../../modules/postgres/settings/utils';
import { UserPostgresService } from '../../../modules/postgres/user.pg';
import { User } from '@prisma/client';
import CacheService from '../../../modules/cache';
import { TVerificationData } from '../../../utils/helpers/custom.types';
import { MessagingService } from '../../../services/Message.service';

export const USER_SIGNED_UP_VIA_EMAIL = async (message: ServiceEvent<any>): Promise<ServiceResponse<any>> => {
  const settings = await getAppSettings();
  const upgs = new UserPostgresService({});
  console.log({ message });
  if (settings.REQUIRE_VERIFICATION_ON_SIGNUP) {
    const { id: userId } = message.data!.user;
    if (!userId) {
      return statusTypes.get('ExpectationFailed')!({
        message: 'Invalid event message',
        fix: `User Id not found - received ${userId}`,
      });
    }
    // TODO: check if user exists in own database
    const check: TStatus<'user', User> = (await upgs.findById({ id: userId })).result!;
    // TODO: if user exists, compare fields, if not - Update own database

    // TODO: if user does not exists, create user record
    if (!check.data?.user) await upgs.create(message.data?.user);

    // TODO: Get user verification data
    const cs = new CacheService();
    const verifData = (await cs.formatKey({ scopeToService: false }, 'OTP', 'EMAIL', userId).get())
      .result! as TVerificationData;
    console.log({ verifData });
    // ? Shorten token URL?
    // TODO: Get signupemail template\
    const messagingService = new MessagingService(['EMAIL'], settings);
    await messagingService.prepareTemplate('USER_SIGNUP_VERIFICATION_CODE');

    // TODO: Populate Template and formulate email
    // TODO: Send signup email
  }
  return statusTypes.get('OK')!({});
};
