import { createClient } from 'redis';
import { config } from '../config/config';
import CacheService from '../modules/cache';
import { events } from '../events/eventTypes';

let redisClient: RedisConnection;

export const connectRedis = (url = config.redis.url) => {
  return createClient({ url }).on('error', (err) => console.log('Redis Client Error', err));
};

export const setRedisClient = (client: RedisConnection = connectRedis()) => (redisClient = client);
export const getRedisClient = () => redisClient;

export type RedisConnection = ReturnType<typeof connectRedis>;

export const serviceUP = async () => {
  const redis = new CacheService();
  const scopeToService = false;
  const { name, host, publicUrl, queue, basePath } = config.self;
  const serviceData = JSON.stringify({ name, host, publicUrl, queue, basePath });
  redis.formatKey({ scopeToService }, 'services');
  const existing = (await redis.hGet(name)).result;
  if (existing) {
    JSON.stringify(existing) === serviceData ? null : await redis.hSet({ [name]: serviceData });
    await redis.hSet({ [name]: JSON.stringify(events) }, 'events', { scopeToService });
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
  const list = services.length ? services : serviceKeys;
  list.forEach((sk) => {
    if (sk !== config.self.name) relevantQueues.push(JSON.parse(savedServices[sk]).queue);
  });
  return relevantQueues;
};
