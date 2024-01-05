import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'config/config.module';
import { REDIS_CLIENT_OPTIONS, RedisClientOptions, RedisClientProvider } from '../providers/redis-client.provider';

@Module({})
export class RedisModule {
  static register(options: Partial<RedisClientOptions> = {}): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT_OPTIONS,
          useValue: options,
        },
        RedisClientProvider,
      ],
      imports: [ConfigModule],
      exports: [RedisClientProvider],
    };
  }
}
