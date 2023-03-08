import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'prisma/prisma.module';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { CommonModule } from 'common/common.module';
import { EventModule } from 'event/event.module';
import { UserModule } from 'user/user.module';

@Module({
  providers: [WebhookService],
  controllers: [WebhookController],
  imports: [PrismaModule, HttpModule, EventModule, CommonModule, UserModule],
  exports: [WebhookService],
})
export class WebhookModule {
}
