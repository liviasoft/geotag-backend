// import { ServiceEvent, ServiceResponse, TStatus, statusTypes } from '@neoncoder/typed-service-response';
// import { UserPostgresService } from '../../../modules/postgres/user.pg';
// import { User } from '@prisma/client';
// import CacheService from '../../../modules/cache';

import { ServiceEvent, ServiceResponse, statusTypes } from '@neoncoder/typed-service-response';

export const USER_LOGGED_IN = async (message: ServiceEvent<any>): Promise<ServiceResponse<any>> => {
  return statusTypes.get('OK')!({ message: `unhandled event ${message.type}` });
};
