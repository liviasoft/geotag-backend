import { Response, Request, NextFunction } from 'express';
import { ServiceResponse, TStatusCode, statusCodes, statusTypes } from '@neoncoder/typed-service-response';
import { dateFormatter, timeDiffInSecs, timeTillFormatter } from '@neoncoder/validator-utils';

export const resourceActions = {
  create: 'create',
  readOwn: 'readOwn',
  readAny: 'readAny',
  updateOwn: 'updateOwn',
  updateAny: 'updateAny',
  deleteOwn: 'deleteOwn',
  deleteAny: 'deleteAny',
};

export type TResourceAction = keyof typeof resourceActions;

export type TSerializedPermission = {
  [key: string]: {
    create: boolean;
    readOwn: boolean;
    readAny: boolean;
    updateOwn: boolean;
    updateAny: boolean;
    deleteOwn: boolean;
    deleteAny: boolean;
    name: string;
  };
};

export type TResourcePermissionCheck = {
  action: TResourceAction;
  resource: string;
  perms?: TSerializedPermission;
};

/**
 * Check if request has at least one role
 * @middleware {@link roles} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {[String]} roles - Array of roles to check if the user has at least one
 * @param {Boolean} allow - reverse access (i.e allow role - default true)
 * @example
 * app.get("/", roles(['admin', 'super_admin']), handler)
 * // Allows a request with 'ADMIN' || 'SUPER_ADMIN' roles
 * @example
 * app.get("/", roles(['guest', 'visitor'], false), handler)
 * // Disallow a request with 'GUEST' || 'VISITOR' roles
 */
export const roles =
  (roles: string[], allow: boolean = true) =>
  (_: Request, res: Response, next: NextFunction) => {
    const { roles: userRoles } = res.locals;
    const hasOneOfRoles = roles.some(
      (role) => userRoles[role.toUpperCase()] && userRoles[role.toUpperCase()]['active'],
    );
    if ((!hasOneOfRoles && allow) || (hasOneOfRoles && !allow)) {
      const sr: ServiceResponse<any> = statusTypes.get('Forbidden')!({
        meta: `${roles.join(' or ')} role${roles.length > 1 ? 's' : ''} ${allow ? 'required' : 'not allowed'}`,
      });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if request has all roles
 * @middleware {@link allRoles} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {[String]} roles - Array of roles to check if the user has all
 * @param {Boolean} allow - reverse access (i.e allow role - default true)
 * @example
 * app.get("/", roles(['admin', 'super_admin']), handler)
 * // Allows a request with 'ADMIN' && 'SUPER_ADMIN' roles
 * @example
 * app.get("/", roles(['guest', 'visitor'], false), handler)
 * // Disallow a request with 'GUEST' && 'VISITOR' roles
 */
export const allRoles =
  (roles: string[], allow: boolean = true) =>
  (_: Request, res: Response, next: NextFunction) => {
    const { roles: userRoles } = res.locals;
    const hasRoles = roles.every((role) => userRoles[role.toUpperCase()] && userRoles[role.toUpperCase()]['active']);
    if ((!hasRoles && allow) || (hasRoles && !allow)) {
      const sr = statusTypes.get('Forbidden')!({
        meta: `${roles.join(' and ')} role${roles.length > 1 ? 's' : ''} ${allow ? 'required' : 'not allowed'}`,
      });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if request has role
 * @middleware {@link allRoles} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} role - role to check the user has
 * @param {Boolean} allow - reverse access (i.e allow role - default true)
 * @example
 * app.get("/", role('admin'), handler)
 * // Only allows a request with 'ADMIN' role
 * @example
 * app.get("/", role('guest', false), handler)
 * // Do not allow a request with 'GUEST' role
 */
export const role =
  (role: string, allow: boolean = true) =>
  (_: Request, res: Response, next: NextFunction) => {
    const hasRole = res.locals.roles && Boolean(res.locals.roles[role.toUpperCase()]);
    if ((!hasRole && allow) || (hasRole && !allow)) {
      const sr = statusTypes.get('Forbidden')!({ meta: `${role} role ${allow ? 'required' : 'not allowed'}` });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if request has resource permissions or privileges
 * @middleware {@link rperm} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} permission - syntax **[resource][seperator][action]** e.g.('user.create', 'post-updateAny')
 * @param {String} [seperator] - character to split from (default '.')
 * - resource - any resource/model registered in the database
 * - action {@link TResourceAction} one of - create, updateOwn, updateAny, readOwn, readAny, deleteOwn, deleteAny
 * @example
 * app.put("/posts/:id", rperm('post.updateOwn'), handler)
 * // allow request with permission to update own post
 * @example
 * app.get("/users", rperm('user-readAny', '-'), handler)
 * // permission check with custom seperator
 */
export const rperm =
  (permission: string, seperator: string = '.') =>
  (_: Request, res: Response, next: NextFunction) => {
    const { permissions: perms } = res.locals;
    const [r, a] = permission.split(seperator);
    const action = a as unknown as TResourceAction;
    const resource = r.toUpperCase();
    if (!hasPermission({ action, resource, perms })) {
      const sr = statusTypes.get('Forbidden')!({ meta: `${action} ${resource} permission required` });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if request has multiple resource permissions or privileges
 * @middleware {@link rperm} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} resource - e.g.('user.create', 'post-updateAny')
 * @param {[TResourceAction]} args[] - any number of {@link TResourceAction} permissions to check
 * - resource - any resource/model registered in the database
 * - action {@link TResourceAction} one of - create, updateOwn, updateAny, readOwn, readAny, deleteOwn, deleteAny
 * @example
 * app.put("/posts/:id", rperms('post', 'create', 'readOwn', 'updateOwn', 'deleteOwn'), handler)
 * // allow request with permission to create, read, update and delete their own posts
 * @example
 * app.get("/users", rperms('user', 'readAny'), handler)
 * // permission check with a single action
 */
export const rperms =
  (resource: string, ...args: TResourceAction[]) =>
  (_: Request, res: Response, next: NextFunction) => {
    const { permissions: perms } = res.locals;
    if (!hasPermissions({ actions: args, resource, perms })) {
      const sr = statusTypes.get('Forbidden')!({
        meta: `${resource} ${args.join(', ')} permission${args.length > 1 ? 's' : ''} required`,
      });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if request has resource permissions or privileges
 * @function {@link hasPermission} returns {@link Boolean}
 * @param {...TResourcePermissionCheck} checkObj - {@link TResourcePermissionCheck}
 * @param {String} checkObj.resource - resource e.g.(user, post, comment)
 * @param {TResourceAction} checkObj.action - {@link TResourceAction} one of - create, updateOwn, updateAny, readOwn, readAny, deleteOwn, deleteAny
 * @param {TSerializedPermission} checkObj.perms - {@link TSerializedPermission} Permissions object e.g. {POST: {create: true, updateAny: false}}
 * @example
 * const perms = {POST: {create: true, deleteAny: false}}
 * // Sample user Permissions object (see TSerializedPermission)
 * hasPermission({action: 'create', resource: 'post', perms})
 * // true
 * hasPermission({action: 'deleteAny', resource: 'post', perms})
 * // false (POST.deleteAny value on perms object)
 * hasPermission({action: 'updateOwn', resource: 'post', perms})
 * // false (POST.updateOwn does not exist on perms)
 * hasPermission({action: 'readAny', resource: 'comment', perms})
 * // false (COMMENT key does not exist on perms)
 * @example
 * const reqPerms = {action: 'updateOwn', resource: 'post', perms}
 * if (hasPermission(reqPerms)) { }
 * // allow requests with permission to view all users
 */
export const hasPermission = ({ action, resource, perms = {} }: TResourcePermissionCheck) => {
  if (!resourceActions[action] || !resource || !perms) return false;
  const [r, a] = [resource.toUpperCase(), action];
  return perms[r] ? perms[r][a] : false;
};

/**
 * Check if request has resource permissions or privileges
 * @function {@link hasPermissions} returns {@link Boolean}
 * @param {...TResourcePermissionCheck} checkObj - {@link TResourcePermissionCheck}
 * @param {String} checkObj.resource - resource e.g.(user, post, comment)
 * @param {[TResourceAction]} checkObj.actions - Array of {@link TResourceAction} - create, updateOwn, updateAny, readOwn, readAny, deleteOwn, deleteAny
 * @param {TSerializedPermission} checkObj.perms - {@link TSerializedPermission} Permissions object e.g. {POST: {create: true, updateAny: false}}
 * @example
 * const perms = {POST: {create: true, readOwn: true, deleteAny: false}} // Sample permissions object
 * const resource = 'post'
 * const actions1 = ['create', 'readOwn']
 * const actions2 = ['create', 'updateAny'] // returns false
 * const actions3 = ['create', 'deleteAny'] // returns false
 * hasPermissions({actions: actions1, resource, perms})
 * // true
 * hasPermission({action: actions2, resource, perms})
 * // false
 * hasPermission({action: actions3, resource: 'post', perms})
 * // false
 */
export const hasPermissions = ({
  actions,
  resource,
  perms = {},
}: {
  actions: TResourceAction[];
  resource: string;
  perms?: TSerializedPermission;
}) => {
  const reqPerms: TResourcePermissionCheck[] = [];
  Array.from(new Set(actions)).forEach((action) => {
    reqPerms.push({ action, resource, perms });
  });
  return reqPerms.every(hasPermission);
};

/**
 * Check if request has special permissions or privileges
 * @middleware {@link specPerm} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} specialPermission - e.g.('MY_SPECIAL_PERMISSION')
 * @example
 * app.get("/premium-posts/:id", specPerm('PAID_SUBSCRIBER'), handler)
 * // allow request with specialPermission 'PAID_SUBSCRIBER'
 */
export const specPerm = (specialPermission: string) => (_: Request, res: Response, next: NextFunction) => {
  const { specialPermissions: specPerms } = res.locals;
  const isAuthorized = specPerms && specPerms[specialPermission] && specPerms[specialPermission]['active'];
  if (!isAuthorized) {
    const sr = statusTypes.get('Forbidden')!({ meta: `${specialPermission} special permission required` });
    return res.status(sr.statusCode).send(sr);
  }
  return next();
};

/**
 * Check if feature flag is enabled
 * @middleware {@link sfff} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} scopeFeatureFlag - **[scope][seperator][feature][seperator][flag]**
 * - e.g.('auth.login.email', 'account.manage.update')
 * @param {String} [seperator] - character to split from (default '.')
 * @example
 * app.get("/premium-posts/:id", sfff('post.content.view'), handler)
 * // require 'VIEW' flag enabled on the 'CONTENT' feature on 'POST' service
 * @example
 * app.patch("/user/me", sfff('user-manage-update', '-'), handler)
 * // require 'UPDATE' flag enabled on 'MANAGE' feature on 'USER' service
 */
export const sfff =
  (scopeFeatureFlag: string, seperator: string = '.') =>
  (_: Request, res: Response, next: NextFunction) => {
    const { scope, featureBans } = res.locals;
    const [s, f, ff] = scopeFeatureFlag.toUpperCase().split(seperator);
    const { allow, message, code } = checkFeatureFlag(scope[s], f, ff);
    if (!allow) {
      const sr = statusCodes.get(code)!({ message });
      return res.status(sr.statusCode).send(sr);
    }
    if (featureBans && featureBans[f] && featureBans[f]['isActive']) {
      const { expiresAt } = featureBans[f];
      const message = `You have been banned from this feature ${expiresAt ? 'till ' : ''}${dateFormatter({ dateLike: expiresAt })}`;
      const fix = expiresAt
        ? `Ban will be lifted in ${timeTillFormatter(timeDiffInSecs(expiresAt)!, {})}`
        : `Ban is Permanent, please contact support`;
      const sr = statusTypes.get('Forbidden')!({ message, fix });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if feature flag is enabled
 * @middleware {@link sf} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {String} scopeFeature - **[scope][seperator][feature]**
 * - e.g.('auth.login', 'account.manage')
 * @param {String} [seperator] - character to split from (default '.')
 * @example
 * app.get("/premium-posts/:id", sfff('post.content.view'), handler)
 * // require 'VIEW' flag enabled on the 'CONTENT' feature on 'POST' service
 * @example
 * app.patch("/user/me", sfff('user-manage-update', '-'), handler)
 * // require 'UPDATE' flag enabled on 'MANAGE' feature on 'USER' service
 */
export const sf =
  (scopeFeature: string, seperator: string = '.') =>
  (_: Request, res: Response, next: NextFunction) => {
    const { scope, featureBans } = res.locals;
    const [s, f] = scopeFeature.toUpperCase().split(seperator);
    const { allow, message, code } = checkFeature(scope[s], f);
    if (!allow) {
      const sr = statusCodes.get(code)!({ message });
      return res.status(sr.statusCode).send(sr);
    }
    if (featureBans && featureBans[f] && featureBans[f]['isActive']) {
      const { expiresAt } = featureBans[f];
      const message = `You have been banned from this feature ${expiresAt ? 'till ' : ''}${dateFormatter({ dateLike: expiresAt })}`;
      const fix = expiresAt
        ? `Ban will be lifted in ${timeTillFormatter(timeDiffInSecs(expiresAt)!, {})}`
        : `Ban is Permanent, please contact support`;
      const sr = statusTypes.get('Forbidden')!({ message, fix });
      return res.status(sr.statusCode).send(sr);
    }
    return next();
  };

/**
 * Check if feature flag is enabled
 * @function {@link sfff} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {Object} s - **scope** serialized object added by middleware
 * @param {String} f - **feature** feature to check if enabled
 * @param {String} ff - **featureFlag** featureFlag to check if enabled
 * @example
 * // return error if the 'REGISTER' feature flag is not enabled
 * const {scope} = res.locals
 * const ff = checkFeatureFlag(scope['auth'], 'register', 'email')
 * if(!ff.allow) {
 *    const sr = statusCodes.get(ff.code)!({message: ff.message})
 *    return res.status(sr.statusCode)
 * }
 */
export const checkFeatureFlag = (
  s: any,
  f: string,
  ff: string,
): { allow: boolean; message: string; code: TStatusCode } => {
  console.log({ s });
  if (!s) return { message: 'Service not registered', code: 502, allow: false }; // Service not registered
  if (!s.active) return { message: 'Service temporarily disabled', code: 503, allow: false }; // Service not active / enabled
  if (!s['features'][f]) return { message: 'Feature not registered', code: 405, allow: false }; // Feature not registered
  if (!s['features'][f]['active']) return { message: 'Feature temporarily disabled', code: 403, allow: false }; // Feature not active / enabled
  if (!s['features'][f]['featureFlags'][ff])
    return { message: 'This action is not registered', code: 422, allow: false }; // Feature Flag not registered
  if (!s['features'][f]['featureFlags'][ff]['active'])
    return { message: 'This action is currently disabled', code: 423, allow: false }; // Feature Flag not active / enabled
  return { message: 'OK', allow: true, code: 200 };
};

/**
 * Check if feature is enabled
 * @function {@link sfff} returns {@link NextFunction} or unauthorized {@link ServiceResponse}
 * @param {Object} s - **scope** serialized object added by middleware
 * @param {String} f - **feature** feature to check if enabled
 * @example
 * // return error if the 'REGISTER' feature is not enabled
 * const {scope} = res.locals
 * const feat = checkFeature(scope['auth'], 'register')
 * if(!feat.allow) {
 *    const sr = statusCodes.get(feat.code)!({message: feat.message})
 *    return res.status(sr.statusCode)
 * }
 */
export const checkFeature = (s: any, f: string): { allow: boolean; message: string; code: TStatusCode } => {
  console.log({ s });
  if (!s) return { message: 'Service not registered', code: 502, allow: false }; // Service not registered
  if (!s.active) return { message: 'Service temporarily disabled', code: 503, allow: false }; // Service not active / enabled
  if (!s['features'][f]) return { message: 'Feature not registered', code: 405, allow: false }; // Feature not registered
  if (!s['features'][f]['active']) return { message: 'Feature temporarily disabled', code: 403, allow: false }; // Feature not active / enabled
  return { message: 'OK', allow: true, code: 200 };
};
