import { createClient } from 'redis';
import { config } from '../utils/config';
import CacheService from '../modules/cache';
import { events } from '../events/eventTypes';

let redisClient: RedisConnection;

export const connectRedis = (url = config.redis.url) => {
  return createClient({ url }).on('error', (err) => console.log('Redis Client Error', err));
};

export const setRedisClient = (client: RedisConnection = connectRedis()) => (redisClient = client);
export const getRedisClient = () => redisClient;

export type RedisConnection = ReturnType<typeof connectRedis>;

/**
 * Stores service info in redis.
 * Adds service details to **[appname][s]services** hash
 * Adds service events to **[appname][s]events** hash
 * @async {@link serviceUP}
 * @storeskey - **[appname][s]services** : {serviceName: serviceDetails}
 * @storeskey - **[appname][s]events** : {serviceName: serviceEventEnum}
 * @returns {Promise<void>}
 */
export const serviceUP = async (): Promise<void> => {
  const redis = new CacheService();
  const { name, host, publicUrl, queue } = config.self;
  const scopeToService = false;
  const serviceData = JSON.stringify({ name, host, publicUrl, queue });
  redis.formatKey({ scopeToService }, 'services');
  const existing = (await redis.hGet(name)).result;
  if (existing) {
    JSON.stringify(existing) === serviceData ? null : await redis.hSet({ [name]: serviceData });
    return;
  }
  await redis.hSet({ [name]: serviceData });
  await redis.hSet({ [name]: JSON.stringify(events) }, 'events', { scopeToService });
  console.log('Service newly registered');
};

export const getServiceQueues = async (services: string[] = []) => {
  const redis = new CacheService();
  const savedServices = (await redis.formatKey({ scopeToService: false }, 'services').hGetAll()).result;
  const relevantQueues: string[] = [];
  const serviceKeys = Object.keys(savedServices);
  const list = services.length ? serviceKeys : services;
  console.log({ savedServices, relevantQueues, services, list });
  list.forEach((sk) => {
    if (savedServices[sk].queue !== config.self.queue) relevantQueues.push(savedServices[sk].queue);
  });
  return relevantQueues;
};

export const getServiceEvents = async (service: string) => {
  const redis = new CacheService();
  const serviceEvents: { [key: string]: string } = (await redis.hGet(service, 'events', { scopeToService: false }))
    .result!;
  return serviceEvents;
};
