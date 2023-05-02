import fs from 'fs';
import handlebars from 'handlebars';
import lodash from 'lodash';
import convert from '@openapi-contrib/json-schema-to-openapi-schema';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePluginDto, PropertySpecification, PropertyType, Specification } from '@poly/common';
import { FunctionService } from 'function/function.service';
import { ApiFunction, GptPlugin } from '@prisma/client';
import { Request } from 'express';

const POLY_DEFAULT_ICON_URL = "https://polyapi.io/wp-content/uploads/2023/03/poly-block-logo-mark.png";

type PluginFunction = Specification & {
  executePath: string;
  operationId: string;
};

type OpenApiResponse = {
  type: string;
  properties?: object;
  description?: string;
  required?: string[];
};

type Schema = {
  name: string;
  type: string;
  description: string;
  arguments?: object;
  argumentsRequired?: string[];
};

function _getExecuteType(t: string) {
  switch (t) {
    case 'apiFunction':
      return 'api';
    default:
      return 'unknown';
  }
}

function _getArgumentsRequired(args: PropertySpecification[]): string[] {
  const rv: string[] = [];
  for (const arg of args) {
    if (arg.required) {
      rv.push(arg.name);
    }
  }
  return rv;
}

const loadTemplate = async () => fs.readFileSync(
  // HACK this feels super hardcody
  `${process.cwd()}/dist/gptplugin/templates/openapi.json.hbs`,
  'utf8');

const _getBodySchema = (f: PluginFunction): Schema => {
  const rv: Schema = {
    name: `${f.operationId}Body`,
    type: 'object',
    // pretty sure OpenAPI needs a description so just use this!
    description: 'arguments',
  };
  if (f.function.arguments) {
    rv.arguments = f.function.arguments;
    rv.argumentsRequired = _getArgumentsRequired(f.function.arguments);
  }
  return rv;
};

const _getReturnType = (t: PropertyType): string => {
  if (t.kind === 'void' || t.kind === 'plain') {
    // HACK just assume these are strings for now
    return 'string';
  } else if (t.kind === 'primitive') {
    return t.type;
  } else if (t.kind === 'function') {
    throw new Error('Cannot support functions yet');
  } else {
    return t.kind;
  }
};

function _cleanupProperties(properties: object) {
  for (const [key, value] of Object.entries(properties)) {
    if (value.$ref) {
      delete properties[key];
    }
  }
}

async function _getResponseSchema(f: PluginFunction) {
  // @ts-expect-error: it's ok
  const jsonSchema = f.function.returnType.schema;
  const type = _getReturnType(f.function.returnType);

  let converted: null | OpenApiResponse = null;
  if (jsonSchema && type === 'object') {
    const temp = (await convert(jsonSchema)) as unknown;
    converted = temp as OpenApiResponse;
  }

  const schema: OpenApiResponse  = {
    type,
    description: 'response',
  };
  if (converted?.properties) {
    schema.properties = converted.properties;
    _cleanupProperties(schema.properties);
  }

  return {
    name: `${f.operationId}Response`,
    schema: JSON.stringify(schema, null, 2),
  };
}

const _getOperationId = (f: ApiFunction): string => {
  // HACK this could be way more efficient, oh well
  let parts: string[] = [...f.context.split('.'), ...f.name.split('.')];
  parts = parts.map((s) => lodash.startCase(s));
  return lodash.camelCase(parts.join(''));
};

async function _apiFunctionMap(f: ApiFunction, functionService: FunctionService): Promise<PluginFunction> {
  const details = await functionService.toApiFunctionSpecification(f);
  const executeType = _getExecuteType(details.type);

  return new Promise((resolve) => {
    resolve({
      executePath: `/functions/${executeType}/${f.publicId}/execute`,
      operationId: _getOperationId(f),
      ...details,
    });
  });
}

@Injectable()
export class GptPluginService {
  private readonly logger = new Logger(GptPluginService.name);

  constructor(
    private readonly functionService: FunctionService,
    // TODO use with updatePlugin endpoint?
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async _getAllFunctions(publicIds: string[]): Promise<PluginFunction[]> {
    const apiFunctions = await this.prisma.apiFunction.findMany({ where: { publicId: { in: publicIds } } });
    // const customFunctions = await this.prisma.customFunction.findMany({ where: { publicId: { in: publicIds } } });
    // const authFunctions = await this.prisma.authFunction.findMany({ where: { publicId: { in: publicIds } } });

    const functions = await Promise.all(
      apiFunctions.map((apiFunction) => _apiFunctionMap(apiFunction, this.functionService)),
    );

    return functions;
    // .concat(...customFunctions.map(customFunction => this.functionService.customFunctionToDefinitionDto(customFunction)))
    // .concat(...authFunctions.map(authFunction => this.functionService.authFunctionToDefinitionDto(authFunction)))
  }

  getOpenApiUrl(host: string, slug: string): string {
    const protocol = host === "localhost" ? "http" : "https";
    if (slug === "develop" || slug === "staging") {
      // HACK for now staging/develop just use hardcoded manifests
      return `${protocol}://${host}/openapi-${slug}.json`
    } else {
      return `${protocol}://${host}/plugin/${slug}/openapi`;
    }
  }

  async getOpenApiSpec(slug: string): Promise<string> {
    const plugin = await this.prisma.gptPlugin.findUniqueOrThrow({
      where: { slug },
    });

    const functionIds = JSON.parse(plugin.functionIds);
    const functions = await this._getAllFunctions(functionIds);
    const bodySchemas = functions.map((f) => _getBodySchema(f));
    const responseSchemas = await Promise.all(functions.map((f) => _getResponseSchema(f)));

    const template = handlebars.compile(await loadTemplate());
    return template({ plugin: plugin, functions, bodySchemas, responseSchemas });
  }

  async createPlugin(body: CreatePluginDto): Promise<GptPlugin> {
    const update = {};
    const functionIds = body.functionIds ? JSON.stringify(body.functionIds) : "";

    if (body.name) {
      update['name'] = body.name;
    }
    if (functionIds) {
      update['functionIds'] = functionIds;
    }

    return this.prisma.gptPlugin.upsert({
      where: {
        slug: body.slug
      },
      update: {...update},
      create: {
        slug: body.slug,
        name: body.name ? body.name : body.slug,
        iconUrl: body.iconUrl ? body.iconUrl : POLY_DEFAULT_ICON_URL,
        functionIds
      },
    });
  }

  async _getHostAndSlug(host: string): Promise<{ slug: string; host: string }> {
    const slug = host.split(".")[0]
    // make sure this is valid plugin host
    await this.prisma.gptPlugin.findUniqueOrThrow({where: {slug}});
    return {host, slug}
  }

  async getManifest(req: Request) {
    const {host, slug} = await this._getHostAndSlug(req.hostname)

    return {
      schema_version: 'v1',
      name_for_human: `Poly API ${lodash.startCase(slug)}`,
      name_for_model: 'poly_api',
      description_for_human: 'Ask ChatGPT to compose and execute chains of tasks on Poly API',
      description_for_model: 'Ask ChatGPT to compose and execute chains of tasks on Poly API',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: this.getOpenApiUrl(host, slug),
        is_user_authenticated: false,
      },
      logo_url: 'https://polyapi.io/wp-content/uploads/2023/03/poly-block-logo-mark.png',
      contact_email: 'darko@polyapi.io',
      legal_info_url: 'https://polyapi.io/legal',
    };
  }
}
