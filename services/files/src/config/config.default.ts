export const defaultConfig = {
  appName: 'LIVIASOFT',
  self: {
    port: 3004,
    name: 'files',
    host: 'http://localhost:3004',
    basePath: 'api/v1',
    publicUrl: 'http://localhost:3004/api/v1/files',
    queue: 'liviasoft-files-queue',
    jwtSecret: 'secret',
    emoji: '📂',
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
    scope: 'LIVIASOFT'.toLowerCase(),
  },
  rabbitMQ: {
    url: 'amqp://localhost:5672?connection_attempts=5&retry_delay=5',
    queue: 'liviasoft-files-queue',
    exchange: 'LIVIASOFT',
    exqueue: 'liviasoft-files-x-queue',
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
