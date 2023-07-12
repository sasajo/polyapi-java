import { forwardRef, Module } from '@nestjs/common';
import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';
import { WebhookModule } from 'webhook/webhook.module';
import { FunctionModule } from 'function/function.module';
import { AuthModule } from 'auth/auth.module';

@Module({
  controllers: [TriggerController],
  providers: [TriggerService],
  imports: [
    forwardRef(() => WebhookModule),
    forwardRef(() => FunctionModule),
    AuthModule,
  ],
  exports: [TriggerService],
})
export class TriggerModule {}
