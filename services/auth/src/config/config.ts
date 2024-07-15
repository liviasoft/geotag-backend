import { configDotenv } from 'dotenv';
import { defaultConfig } from './config.default';

const { parsed } = configDotenv();

export const config = parsed
  ? {
      appName: parsed.APPNAME ?? process.env.APPNAME,
      self: {
        port: parsed.PORT ?? process.env.PORT,
        name: parsed.SERVICE_NAME ?? process.env.SERVICE_NAME,
        host: parsed.SERVICE_HOST ?? process.env.SERVICE_HOST,
        basePath: parsed
          ? `${parsed.BASE_PATH}/${parsed.SERVICE_NAME}`.toLowerCase()
          : `${process.env.BASE_PATH}/${process.env.SERVICE_NAME}`.toLowerCase(),
        publicUrl: parsed
          ? `${parsed.SERVICE_HOST}/${parsed.BASE_PATH}/${parsed.SERVICE_NAME}`.toLowerCase()
          : `${process.env.SERVICE_HOST}/${process.env.BASE_PATH}/${process.env.SERVICE_NAME}`.toLowerCase(),
        queue: parsed
          ? `${parsed.APPNAME}-${parsed.SERVICE_NAME}-queue`
          : `${process.env.APPNAME}-${process.env.SERVICE_NAME}-queue`,
        jwtSecret: parsed.JWT_SECRET ?? process.env.JWT_SECRET,
        emoji: parsed.EMOJI ?? process.env.EMOJI,
        accessTokenTTL: parsed.ACCESS_TOKEN_TTL ?? process.env.ACCESS_TOKEN_TTL,
        accessTokenTTLMS: parsed.ACCESS_TOKEN_TTL_MS ?? process.env.ACCESS_TOKEN_TTL_MS,
        refreshTokenTTL: parsed.REFRESH_TOKEN_TTL ?? process.env.REFRESH_TOKEN_TTL,
        refreshTokenTTLMS: parsed.REFRESH_TOKEN_TTL_MS ?? process.env.REFRESH_TOKEN_TTL_MS,
        adminEmail: parsed.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL,
        adminPhone: parsed.ADMIN_PHONE ?? process.env.ADMIN_PHONE,
        env: parsed.ENVIRONMENT ?? process.env.ENVIRONMENT,
      },
      redis: {
        url: parsed.REDIS_URL ?? process.env.REDIS_URL,
        scope: parsed.SERVICE_NAME ?? process.env.SERVICE_NAME,
      },
      rabbitMQ: {
        url: parsed.RABBITMQ_URL ?? process.env.RABBITMQ_URL,
        queue: parsed
          ? `${parsed.APPNAME}-${parsed.SERVICE_NAME}-queue`
          : `${process.env.APPNAME}-${process.env.SERVICE_NAME}-queue`,
        exchange: parsed.APPNAME ?? process.env.APPNAME,
        exqueue: parsed
          ? `${parsed.APPNAME}-${parsed.SERVICE_NAME}-x-queue`
          : `${process.env.APPNAME}-${process.env.SERVICE_NAME}-x-queue`,
      },
      pocketbase: {
        url: parsed.POCKETBASE_URL ?? process.env.POCKETBASE_URL,
        adminEmail: parsed.PB_ADMIN_EMAIL ?? process.env.PB_ADMIN_EMAIL,
        adminPassword: parsed.PB_ADMIN_PASSWORD ?? process.env.PB_ADMIN_PASSWORD,
      },
      memgraph: {
        uri: parsed.NEO4J_URI ?? process.env.NEO4J_URI,
        username: parsed.NEO4J_USERNAME ?? process.env.NEO4J_USERNAME,
        password: parsed.NEO4J_PASSWORD ?? process.env.NEO4J_PASSWORD,
      },
      influxdb: {
        token: parsed.INFLUXDB_TOKEN ?? process.env.INFLUXDB_TOKEN,
        url: parsed.INFLUXDB_URL ?? process.env.INFLUXDB_URL,
        org: parsed.INFLUXDB_ORG ?? process.env.INFLUXDB_ORG,
        bucket: parsed.INFLUXDB_BUCKET ?? process.env.INFLUXDB_BUCKET,
      },
      eventStore: {
        uri: parsed.EVENTSTOREDB_URI ?? process.env.EVENTSTOREDB_URI,
      },
    }
  : defaultConfig;
