import { statusTypes } from '@neoncoder/typed-service-response';
import { Request, Response } from 'express';
import CacheService from '../../modules/cache';

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  const { roles, permissions, specialPermissions, user, sessionId, csrfToken } = res.locals;
  const sr = statusTypes.get(res.locals.authUserId ? 'OK' : 'Unauthorized')!({
    message: res.locals.authUserId ? `Logged in as ${user.username}` : 'Not Logged In',
    data: { user, meta: { roles, permissions, specialPermissions, sessionId, csrfToken } },
  });
  return res.status(sr.statusCode).send(sr);
};

export const logoutHandler = async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  const { authUserId, sessionId } = res.locals;
  console.log({ authUserId, sessionId });
  const deleteResult = (
    await new CacheService().formatKey({ scopeToService: false }, 'SESSION', authUserId, sessionId).del()
  ).result;
  console.log({ deleteResult });
  const sr = statusTypes.get('OK')!({ message: 'You have been logged out' });
  return res.status(sr.statusCode).send(sr);
};
