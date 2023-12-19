import { DynamicModule, Module } from '@nestjs/common';
import { RedlockProvider, RedlockOpts, REDLOCK_OPTIONS } from '../providers/redlock.provider';

import { RedisModule } from './redis.module';

@Module({})
export class RedlockModule {
  static register(options: RedlockOpts): DynamicModule {
    return {
      module: RedlockModule,
      providers: [
        {
          provide: REDLOCK_OPTIONS,
          useValue: options,
        },
        RedlockProvider,
      ],
      imports: [RedisModule.register()],
      exports: [RedlockProvider],
    };
  }
}
