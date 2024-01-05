import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from 'config/config.service';
import Redis from 'ioredis';

export { RedisClientType } from 'redis';

export type RedisClientOptions = {
  url: string;
  createNewConnection?: boolean;
  password?: string;
}

export const REDIS_CLIENT_OPTIONS = Symbol('REDIS_CLIENT_OPTIONS');
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const defaultOptions: RedisClientOptions = {
  url: '',
  password: '',
  createNewConnection: false,
};

let redisClient: Redis | null = null;

export const getClient = async (options: RedisClientOptions = defaultOptions) : Promise<Redis> => {
  const host = options.url.split('redis://')[1].split(':')[0];

  if (options.createNewConnection) {
    const newClient: Redis = new Redis({
      host,
      ...(options.password ? { password: options.password } : null),
    });

    return newClient;
  }

  if (!redisClient) {
    redisClient = new Redis({
      host,
      ...(options.password ? { password: options.password } : null),
    });

    return redisClient;
  }

  return redisClient;
};

export const RedisClientProvider = {
  provide: REDIS_CLIENT,
  async useFactory(configService: ConfigService, options: RedisClientOptions) {
    return getClient({ url: options.url || configService.redisUrl, password: options.password || configService.redisPassword });
  },
  inject: [ConfigService, REDIS_CLIENT_OPTIONS],
} as FactoryProvider;
