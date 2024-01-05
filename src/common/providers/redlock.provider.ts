import Redlock, { Settings } from 'redlock';
import { Redis } from 'ioredis';
import { FactoryProvider } from '@nestjs/common';
import { REDIS_CLIENT } from './redis-client.provider';

export const REDLOCK = Symbol('REDLOCK');
export const REDLOCK_OPTIONS = Symbol('REDLOCK_OPTIONS');

export type RedlockOpts = {
    settings: Partial<Settings>
}

const defaultOpts = {
  settings: {
    retryDelay: 1000,
    retryCount: 10,
  },
};

export const RedlockProvider = {
  provide: REDLOCK,
  async useFactory(redisClient: Redis, options: RedlockOpts = defaultOpts) {
    return new Redlock([redisClient], options.settings);
  },
  inject: [REDIS_CLIENT, REDLOCK_OPTIONS],
} as FactoryProvider;
