import { Controller, Logger, Get, Post, UseGuards, Req, Body, Param } from '@nestjs/common';
import { Request } from 'express';
import { CreatePluginDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { GptPluginService } from 'gptplugin/gptplugin.service';


@Controller()
export class GptPluginController {
  private readonly logger = new Logger(GptPluginController.name);
  constructor(private readonly service: GptPluginService) {}

  @Get('.well-known/ai-plugin.json')
  public async aiPluginJson(@Req() req: Request): Promise<unknown> {
    return this.service.getManifest(req)
  }

  @Get('plugin/:slug/openapi')
  public async pluginOpenApi(@Req() req: Request, @Param('slug') slug: string): Promise<unknown> {
    const spec = await this.service.getOpenApiSpec(req.hostname, slug);
    return spec;
  }

  @UseGuards(ApiKeyGuard)
  @Post('plugin/create')
  public async pluginCreate(@Req() req: Request, @Body() body: CreatePluginDto): Promise<unknown> {
    // HACK this is actually get or create based on slug!
    const domain = await this.service.createPlugin(body);
    return {
      domain: domain,
    };
  }
}
