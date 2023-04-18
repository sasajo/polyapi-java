import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiSpecService } from 'gptplugin/gptplugin.service';
import { ApiSpecController } from 'gptplugin/gptplugin.controller';

@Module({
  imports: [HttpModule],
  providers: [ApiSpecService],
  controllers: [ApiSpecController]
})
export class ApiSpecModule {}
