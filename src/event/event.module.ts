import { forwardRef, Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { EventService } from './event.service';
import { AuthModule } from 'auth/auth.module';
import { WebhookModule } from 'webhook/webhook.module';
import { AuthProviderModule } from 'auth-provider/auth-provider.module';
import { VariableModule } from 'variable/variable.module';
import { ApplicationModule } from 'application/application.module';
import { EnvironmentModule } from 'environment/environment.module';
import emitterProvider from './emitter/emitter.provider';
import { SocketStorage } from './socket-storage/socket-storage.provider';
import { RedlockModule } from 'common/modules/redlock.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => WebhookModule),
    forwardRef(() => AuthProviderModule),
    forwardRef(() => VariableModule),
    ApplicationModule,
    EnvironmentModule,
    RedlockModule.register({
      settings: {
        retryDelay: 1000,
        retryCount: 10,
      },
    }),
  ],
  providers: [EventGateway, EventService, emitterProvider, SocketStorage],
  exports: [EventService],
})
export class EventModule {}
