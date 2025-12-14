import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  enableOfflineQueue: false,   // strict
  maxRetriesPerRequest: 2,
  tls: {},                     // REQUIRED for Upstash
  lazyConnect: true            // IMPORTANT
});

redis.on('connect', () => {
  console.log('[REDIS] connected');
});

redis.on('error', (err) => {
  console.error('[REDIS] error', err.message);
});

export default redis;
