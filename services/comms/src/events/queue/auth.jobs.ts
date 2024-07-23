import { ServiceEvent, ServiceResponse, statusTypes } from '@neoncoder/typed-service-response';
import { getServiceEvents } from '../../lib/redis';
import { USER_LOGGED_IN, USER_SIGNED_UP_VIA_EMAIL, USER_SIGNED_UP_VIA_PHONE } from './handlers/auth.handlers';

const authJobs: { [key: string]: (message: ServiceEvent<any>) => Promise<ServiceResponse<any>> } = {
  USER_SIGNED_UP_VIA_EMAIL,
  USER_SIGNED_UP_VIA_PHONE,
  USER_LOGGED_IN,
};

export const authJobsHandler = async (message: ServiceEvent<any>) => {
  console.log({ message });
  const events = await getServiceEvents(message.origin);
  if (authJobs[message.type] && events[message.type]) {
    return await authJobs[message.type](message);
  }
  return statusTypes.get('UnprocessableEntity')!({ message: `${message.type} Event handler not found` });
};
