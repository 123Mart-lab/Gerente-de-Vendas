import IORedis from 'ioredis';
export const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy: () => null // Stop retrying so it doesn't loop ECONNREFUSED
});
connection.on('error', () => {}); // Ignore errors
