import { Express } from 'express';
// import { ScopePostgresService } from '../modules/postgres/settings/scopes.pg';
// import { Scope } from '@prisma/client';
// import { TStatus } from '@neoncoder/typed-service-response';
import { config } from '../config/config';
import { Options, createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
// import { notFoundHander } from '../controllers/default';
import { scope } from './settings';
import { proxyRequestMeta } from './auth';
import { limiter, timeout } from './reqTimeout';
import CacheService from '../modules/cache';
import { getObjectKeys } from '@neoncoder/validator-utils';

export const initReverseProxy = async (app: Express) => {
  type ServiceInfo = { name: string; host: string; publicUrl: string; queue: string; basePath: string };
  const serviceInfoList = (await new CacheService().hGetAll('services', { scopeToService: false })).result;
  // console.log({ serviceInfoList });
  const serviceNames: Array<string | number | symbol> = getObjectKeys(serviceInfoList).filter(
    (x) => x !== config.self.name,
  );
  const services: Array<ServiceInfo> = [];
  serviceNames.forEach((name) => {
    services.push(JSON.parse(serviceInfoList[name]));
  });
  // const spgs = new ScopePostgresService({});
  // const result: TStatus<'scopes', Scope> = (await spgs.getFullList({})).result!;
  // const services = result.data?.scopes as Scope[];
  console.log({ services });
  // services.forEach((s: Scope) => {
  services.forEach((s: ServiceInfo) => {
    const { host, name, basePath: route } = s;
    if (name !== config.self.name) {
      console.log(`${host}/${route}`);
      const proxyOptions: Options = {
        target: `${host}/${route}`,
        changeOrigin: true,
        pathRewrite: {
          [`^${route}`]: '',
        },
        ws: true,
        on: {
          proxyReq: fixRequestBody,
        },
      };

      // Apply rate limiting and timeout middleware before proxying
      app.use(`/${route}`, limiter, timeout, scope(name), proxyRequestMeta, createProxyMiddleware(proxyOptions));
    }
  });

  // app.use('*', notFoundHander);
};
