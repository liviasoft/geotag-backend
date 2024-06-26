import { Express } from 'express';
import { ScopePostgresService } from '../modules/postgres/settings/scopes.pg';
import { Scope } from '@prisma/client';
import { TStatus } from '@neoncoder/typed-service-response';
import { config } from '../utils/config';
import { Options, createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { notFoundHander } from '../controllers/default';
import { scope } from './settings';
import { proxyRequestMeta } from './auth';
import { limiter, timeout } from './reqTimeout';

export const initReverseProxy = async (app: Express) => {
  const spgs = new ScopePostgresService({});
  const result: TStatus<'scopes', Scope> = (await spgs.getFullList({})).result!;
  const services = result.data?.scopes as Scope[];

  services.forEach((s: Scope) => {
    const { route, host, name } = s;
    if (name !== config.self.name) {
      const proxyOptions: Options = {
        target: `${host}${route}`,
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
      app.use(route, limiter, timeout, scope(name), proxyRequestMeta, createProxyMiddleware(proxyOptions));
    }
  });

  app.use('*', notFoundHander);
};
