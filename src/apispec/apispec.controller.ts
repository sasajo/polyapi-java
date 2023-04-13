import { Controller, Logger, Get } from '@nestjs/common';

@Controller()
export class ApiSpecController {
  private readonly logger = new Logger(ApiSpecController.name);

  @Get('.well-known/ai-plugin.json')
  public async aiPluginJson(): Promise<unknown> {
    return {
      schema_version: 'v1',
      name_for_human: 'Poly API Plugin',
      name_for_model: 'poly_api_plugin',
      description_for_human: 'Plugin for performing tasks via Poly API platform.',
      description_for_model: 'Plugin for performing tasks via Poly API platform',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: 'https://develop.polyapi.io/openapi.yaml',
        is_user_authenticated: false,
      },
      logo_url: 'https://polyapi.io/wp-content/uploads/2023/03/poly-block-logo-mark.png',
      contact_email: 'darko@polyapi.io',
      legal_info_url: 'https://polyapi.io/legal',
    };
  }
}
