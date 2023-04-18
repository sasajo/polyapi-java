import { Controller, Logger, Get, Post, UseGuards, Req, Body, Param } from '@nestjs/common';
import { CreatePluginDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ApiSpecService } from 'gptplugin/gptplugin.service';
import { ConfigService } from 'config/config.service';


// HACK
function _capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


@Controller()
export class ApiSpecController {
  private readonly logger = new Logger(ApiSpecController.name);
  constructor(private readonly service: ApiSpecService, private readonly config: ConfigService) {}

  @Get('.well-known/ai-plugin.json')
  public async aiPluginJson(): Promise<unknown> {
    const env = this.config.env
    const host = this.config.hostUrl
    return {
      schema_version: 'v1',
      name_for_human: `Poly API ${_capitalize(env)}`,
      name_for_model: 'poly_api',
      description_for_human: 'Ask ChatGPT to compose and execute chains of tasks on Poly API',
      description_for_model: 'Ask ChatGPT to compose and execute chains of tasks on Poly API',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: this.service.getOpenApiUrl(env, host),
        is_user_authenticated: false,
      },
      logo_url: 'https://polyapi.io/wp-content/uploads/2023/03/poly-block-logo-mark.png',
      contact_email: 'darko@polyapi.io',
      legal_info_url: 'https://polyapi.io/legal',
    };
  }

  @Get('plugin/:name/openapi')
  public async pluginOpenApi(@Param('name') name: string): Promise<unknown> {
    // TODO move over existing openapi.yaml to openapi.yaml.hbs?
    // and pass in the name and functions to the hbs?
    const spec = await this.service.getOpenApiSpec(name);
    return spec;
  }

  @UseGuards(ApiKeyGuard)
  @Post('plugin/create')
  public async pluginCreate(@Req() req, @Body() body: CreatePluginDto): Promise<unknown> {
    const domain = await this.service.createPlugin(body.slug, body.functionIds);
    return {
      domain: domain,
    };
  }
}
