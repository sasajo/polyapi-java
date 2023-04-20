import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GptPluginService } from 'gptplugin/gptplugin.service';
import { GptPluginController } from 'gptplugin/gptplugin.controller';

@Module({
  imports: [HttpModule],
  providers: [GptPluginService],
  controllers: [GptPluginController]
})
export class GptPluginModule {}
