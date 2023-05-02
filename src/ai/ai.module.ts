import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { ConfigModule } from 'config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {
}
