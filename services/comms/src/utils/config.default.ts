export const defaultConfig = {
  appName: 'APPNAME',
  self: {
    port: 3002,
    name: 'comms',
    host: 'http://localhost:3002',
    basePath: 'api/v1',
    publicUrl: 'http://localhost:3002/api/v1/comms',
    queue: 'appname-comms-queue',
    jwtSecret: 'secret',
    emoji: '🔐',
    accessTokenTTL: '1h',
    accessTokenTTLMS: 3600000,
    refreshTokenTTL: '7d',
    refreshTokenTTLMS: 604800000,
    adminEmail: '',
    adminPhone: '',
    env: 'dev',
  },
  redis: {
    url: 'redis://localhost:6379',
    scope: 'APPNAME'.toLowerCase(),
  },
  rabbitMQ: {
    url: 'amqp://localhost:5672?connection_attempts=5&retry_delay=5',
    queue: 'appname-comms-queue',
    exchange: 'APPNAME',
    exqueue: 'appname-comms-x-queue',
  },
  pocketbase: {
    url: 'http://127.0.0.1:8090',
    adminEmail: 'your-pocketbase-email',
    adminPassword: 'your-pocketbase-database',
  },
  memgraph: {
    uri: 'bolt://localhost:7687',
    username: 'memgraph-username',
    password: 'memgraph-password',
  },
  influxdb: {
    url: 'http://localhost:8086',
    token: '',
    org: '',
    bucket: '',
  },
  eventStore: {
    uri: '',
  },
};
