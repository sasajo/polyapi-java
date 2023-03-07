import { Module } from '@nestjs/common';
import { UserModule } from 'user/user.module';
import { EventGateway } from './event.gateway';
import { EventService } from './event.service';

@Module({
  imports: [UserModule],
  providers: [EventGateway, EventService],
  exports: [EventService]
})
export class EventModule {}
