import redis from './redis';

export async function connectRedis(): Promise<void> {
  if (
    redis.status === 'ready' ||
    redis.status === 'connecting' ||
    redis.status === 'reconnecting'
  ) {
    return;
  }

  if (redis.status === 'wait') {
    await redis.connect();
    return;
  }

  throw new Error(`Redis in unexpected state: ${redis.status}`);
}
