import Redis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
 import { config } from '@app/config/index.js';
 
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    client.on('error', (err) => {
      console.error('[Redis] connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('[Redis] connected');
    });
  }
  return client;
}

/**
 * Returns plain connection options for BullMQ.
 * BullMQ ships its own ioredis — passing an external ioredis instance causes
 * a type conflict between the two bundled versions. Passing a plain options
 * object lets BullMQ create its own connection internally.
 */
export function getBullMQConnection(): ConnectionOptions {
  const url = new URL(config.redis.url);
  return {
    host: url.hostname || '127.0.0.1',
    port: url.port ? parseInt(url.port, 10) : 6379,
    password: url.password || undefined,
    db: url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  } as ConnectionOptions;
}
