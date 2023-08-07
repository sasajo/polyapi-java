import { Controller, Logger, Get, Post, UseGuards, Req, Body, Param } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { CreatePluginDto } from '@poly/model';
import { GptPluginService, getSlugSubdomain } from 'gptplugin/gptplugin.service';
import { AuthRequest } from 'common/types';
import { PolyAuthGuard } from 'auth/poly-auth-guard.service';

@ApiSecurity('PolyApiKey')
@Controller()
export class GptPluginController {
  private readonly logger = new Logger(GptPluginController.name);

  constructor(private readonly service: GptPluginService) {}

  @Get('.well-known/ai-plugin.json')
  public async aiPluginJson(@Req() req: Request): Promise<unknown> {
    return this.service.getManifest(req);
  }

  @Get('plugins/:slug/openapi')
  public async pluginOpenApi(@Req() req: Request, @Param('slug') slug: string): Promise<unknown> {
    const spec = await this.service.getOpenApiSpec(req.hostname, slug);
    return spec;
  }

  @UseGuards(PolyAuthGuard)
  @Get('plugins/:slug')
  public async pluginGet(@Req() req: AuthRequest, @Param('slug') slug): Promise<unknown> {
    slug = slug.toLowerCase();
    const plugin = await this.service.getPlugin(slug, req.user.environment.id);
    return {
      plugin,
      plugin_url: `https://${plugin.slug}-${req.user.environment.subdomain}.${req.hostname}`,
      plugin_api_url: `https://${plugin.slug}-${req.user.environment.subdomain}.${req.hostname}/api`,
    };
  }

  @UseGuards(PolyAuthGuard)
  @Post('api')
  public async pluginChat(@Req() req: AuthRequest, @Body() body): Promise<unknown> {
    const slug = getSlugSubdomain(req.hostname)[0];
    const resp = await this.service.chat(req.user, slug, body.message);
    return resp;
  }

  @UseGuards(PolyAuthGuard)
  @Post('plugins')
  public async pluginCreateOrUpdate(@Req() req: AuthRequest, @Body() body: CreatePluginDto): Promise<unknown> {
    const plugin = await this.service.createOrUpdatePlugin(req.user.environment, body);
    return {
      plugin,
      plugin_url: `https://${plugin.slug}-${req.user.environment.subdomain}.${req.hostname}`,
      plugin_api_url: `https://${plugin.slug}-${req.user.environment.subdomain}.${req.hostname}/api`,
    };
  }

  @UseGuards(PolyAuthGuard)
  @Get('whoami')
  public async whoami(@Req() req: AuthRequest): Promise<unknown> {
    const user = req.user.user;
    if (user) {
      return {
        userId: user.id,
        tenantId: user.tenantId,
        environmentId: req.user.environment.id,
        environmentSubdomain: req.user.environment.subdomain,
      };
    } else {
      return {
        userId: null,
      };
    }
  }
}
