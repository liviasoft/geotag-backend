import { configDotenv } from 'dotenv';
import { defaultConfig } from './config.default';

const { parsed } = configDotenv();

export const config = parsed
  ? {
      appName: parsed.APPNAME,
      self: {
        port: parsed.PORT,
        name: parsed.SERVICE_NAME,
        host: parsed.SERVICE_HOST,
        basePath: `${parsed.BASE_PATH}/${parsed.SERVICE_NAME}`.toLowerCase(),
        publicUrl: `${parsed.SERVICE_HOST}/${parsed.BASE_PATH}/${parsed.SERVICE_NAME}`.toLowerCase(),
        queue: `${parsed.APPNAME}-${parsed.SERVICE_NAME}-queue`.toLowerCase(),
        jwtSecret: parsed.JWT_SECRET,
        emoji: parsed.EMOJI,
        accessTokenTTL: parsed.ACCESS_TOKEN_TTL,
        accessTokenTTLMS: parsed.ACCESS_TOKEN_TTL_MS,
        refreshTokenTTL: parsed.REFRESH_TOKEN_TTL,
        refreshTokenTTLMS: parsed.REFRESH_TOKEN_TTL_MS,
        adminEmail: parsed.ADMIN_EMAIL,
        adminPhone: parsed.ADMIN_PHONE,
        env: parsed.ENVIRONMENT,
      },
      redis: {
        url: parsed.REDIS_URL,
        scope: parsed.SERVICE_NAME,
      },
      rabbitMQ: {
        url: parsed.RABBITMQ_URL,
        queue: `${parsed.APPNAME}-${parsed.SERVICE_NAME}-queue`,
        exchange: parsed.APPNAME,
        exqueue: `${parsed.APPNAME}-${parsed.SERVICE_NAME}-x-queue`,
      },
      pocketbase: {
        url: parsed.POCKETBASE_URL,
        adminEmail: parsed.PB_ADMIN_EMAIL,
        adminPassword: parsed.PB_ADMIN_PASSWORD,
      },
      memgraph: {
        uri: parsed.NEO4J_URI,
        username: parsed.NEO4J_USERNAME,
        password: parsed.NEO4J_PASSWORD,
      },
      influxdb: {
        token: parsed.INFLUXDB_TOKEN,
        url: parsed.INFLUXDB_URL,
        org: parsed.INFLUXDB_ORG,
        bucket: parsed.INFLUXDB_BUCKET,
      },
      eventStore: {
        uri: parsed.EVENTSTOREDB_URI,
      },
    }
  : defaultConfig;
