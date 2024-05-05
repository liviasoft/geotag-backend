import 'dotenv/config';

export const config = {
  self: {
    port: process.env.PORT,
    serviceName: process.env.SERVICE_NAME,
    serviceHost: process.env.SERVICE_HOST,
    basePath: process.env.BASE_PATH,
    queue: process.env.RABBITMQ_QUEUE,
    jwtSecret: process.env.JWT_SECRET,
    emoji: process.env.EMOJI,
    accessTokenTTL: process.env.ACCESS_TOKEN_TTL,
    accessTokenTTLMS: process.env.ACCESS_TOKEN_TTL_MS,
    refreshTokenTTL: process.env.REFRESH_TOKEN_TTL,
    refreshTokenTTLMS: process.env.REFRESH_TOKEN_TTL_MS,
    adminEmail: process.env.ADMIN_EMAIL,
    adminPhone: process.env.ADMIN_PHONE,
    env: process.env.ENVIRONMENT,
  },
  redis: {
    url: process.env.REDIS_URL,
    scope: process.env.REDIS_SCOPE,
  },
  rabbitMQ: {
    url: process.env.RABBITMQ_URL,
    queue: process.env.RABBITMQ_QUEUE,
    exchange: process.env.RABBITMQ_EXCHANGE,
    exqueue: process.env.RABBITMQ_X_QUEUE,
  },
  pocketbase: {
    url: process.env.POCKETBASE_URL,
    adminEmail: process.env.PB_ADMIN_EMAIL,
    adminPassword: process.env.PB_ADMIN_PASSWORD,
  },
  memgraph: {
    uri: process.env.NEO4J_URI,
  },
  influxdb: {
    token: process.env.INFLUXDB_TOKEN,
    url: process.env.INFLUXDB_URL as string,
    org: process.env.INFLUXDB_ORG as string,
    bucket: process.env.INFLUXDB_BUCKET as string,
  },
  eventStore: {
    uri: process.env.EVENTSTOREDB_URI,
  },
};
