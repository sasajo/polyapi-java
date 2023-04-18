import { Module } from '@nestjs/common';
import { SpecsController } from './specs.controller';
import { SpecsService } from './specs.service';
import { FunctionModule } from 'function/function.module';
import { AuthProviderModule } from 'auth-provider/auth-provider.module';
import { WebhookModule } from 'webhook/webhook.module';

@Module({
  imports: [FunctionModule, WebhookModule, AuthProviderModule],
  controllers: [SpecsController],
  providers: [SpecsService]
})
export class SpecsModule {}
