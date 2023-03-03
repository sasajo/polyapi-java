import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatService } from 'chat/chat.service';
import { ChatController } from 'chat/chat.controller';

@Module({
  imports: [HttpModule],
  providers: [ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
