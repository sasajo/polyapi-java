import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ApiSpecService {
  private readonly logger = new Logger(ApiSpecService.name);

  constructor(private readonly httpService: HttpService) {}

  getOpenApiUrl(env: string, host: string) {
    // TODO switch to something generated like:
    // url: `${host}/plugin/${name}/openapi`,

    // HACK so ugly for now
    return `${host}/openapi-${env}.yaml`;
  }

  async getOpenApiSpec(slug: string): Promise<unknown> {
    const one = new Promise<string>((resolve, reject) => {
      resolve(`https://${slug}.develop.polyapi.io`);
    });
    return one;
  }

  async createPlugin(slug: string, functionIds: string[]): Promise<string> {
    console.log(functionIds);
    const one = new Promise<string>((resolve, reject) => {
      resolve(`https://${slug}.develop.polyapi.io`);
    });

    // TODO have new GptPlugin data model
    // GptPlugin data model has two properties `name`, `functionIds`
    // unique index on `name`
    // when we try to get the plugin openapi spec, we lookup in the GptPlugin table
    // and generate a new openapi spec on the fly for all the `functionIds`

    // let's just do JSON for the openapi spec for now

    // example of how to do a template:
    // const indexJSTemplate = handlebars.compile(await loadTemplate('index.js.hbs'));
    // indexJSTemplate({
    //   functions,
    //   webhookHandles,
    //   apiBaseUrl: process.env.POLY_API_BASE_URL,
    //   apiKey: process.env.POLY_API_KEY,
    // }),

    // Let's do one test!
    // just get the yaml and make sure it looks good

    return one;
  }
}
