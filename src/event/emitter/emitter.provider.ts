import { FactoryProvider } from '@nestjs/common';
import { getClient } from 'common/providers/redis-client.provider';
import { ConfigService } from 'config/config.service';
import { Emitter } from '@socket.io/redis-emitter';

export const EMITTER = Symbol('EMITTER');

export default {
  provide: EMITTER,
  async useFactory(configService: ConfigService) {
    const client = await getClient({ url: configService.redisUrl, password: configService.redisPassword });

    return new Emitter(client, {}, '/events');
  },
  inject: [ConfigService],
} as FactoryProvider;
