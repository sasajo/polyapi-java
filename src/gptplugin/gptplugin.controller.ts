import { Controller, Logger, Get, Post, UseGuards, Req, Body, Param } from '@nestjs/common';
import { CreatePluginDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { GptPluginService } from 'gptplugin/gptplugin.service';
import { ConfigService } from 'config/config.service';


// HACK
function _capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


@Controller()
export class GptPluginController {
  private readonly logger = new Logger(GptPluginController.name);
  constructor(private readonly service: GptPluginService, private readonly config: ConfigService) {}

  @Get('.well-known/ai-plugin.json')
  public async aiPluginJson(): Promise<unknown> {
    const env = this.config.env
    const host = this.config.hostUrl
    return {
      schema_version: 'v1',
      name_for_human: `Melia Resorts`,
      name_for_model: 'melia_resorts',
      description_for_human: 'Your one stop of the vacation of your dreams.',
      description_for_model: 'This is the Melia hotels plugin whihc can be used to search for availability of hotel rooms, to book rooms, and to confirm details with SMS messages',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: this.service.getOpenApiUrl(env, host),
        is_user_authenticated: false,
      },
      logo_url: 'https://searchlogovector.com/wp-content/uploads/2018/11/meli%C3%A1-hotels-resorts-logo-vector.png',
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
