import { createClient } from 'redis';
import { config } from '../utils/config';

let redisClient: RedisConnection;

export const connectRedis = async (url = config.redis.url) => {
  return createClient({ url }).on('error', (err) => console.log('Redis Client Error', err));
};

export const setRedisClient = (client: RedisConnection = connectRedis()) => (redisClient = client);
export const getRedisClient = () => redisClient;

export type RedisConnection = ReturnType<typeof connectRedis>;
