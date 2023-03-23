import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FunctionService } from 'function/function.service';
import { PrismaModule } from 'prisma/prisma.module';
import { FunctionController } from 'function/function.controller';
import { EventModule } from 'event/event.module';
import { CommonModule } from 'common/common.module';
import { AiModule } from 'ai/ai.module';

@Module({
  imports: [PrismaModule, HttpModule, EventModule, CommonModule, AiModule],
  providers: [FunctionService],
  exports: [FunctionService],
  controllers: [FunctionController]
})
export class FunctionModule {
}
