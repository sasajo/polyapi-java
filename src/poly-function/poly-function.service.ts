import ts from 'typescript';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import mustache from 'mustache';
import { CustomFunction, UrlFunction, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  ArgumentTypes,
  Auth,
  Body,
  FunctionArgument,
  FunctionDefinitionDto,
  FunctionDto,
  Headers,
  Method,
} from '@poly/common';
import { EventService } from 'event/event.service';
import { AxiosError } from 'axios';
import { CommonService } from 'common/common.service';
import { PathError } from 'common/path-error';
import { ConfigService } from 'config/config.service';
import { AiService } from 'ai/ai.service';

const ARGUMENT_PATTERN = /(?<=\{\{)([^}]+)(?=\})/g;

mustache.escape = (text) => text.replace(/"/g, `\\"`);

@Injectable()
export class PolyFunctionService {
  private logger: Logger = new Logger(PolyFunctionService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly eventService: EventService,
    private readonly aiService: AiService,
  ) {
  }

  create(data: Omit<Prisma.UrlFunctionCreateInput, 'createdAt'>): Promise<UrlFunction> {
    return this.prisma.urlFunction.create({
      data: {
        createdAt: new Date(),
        ...data,
      },
    });
  }

  async getUrlFunctionsByUser(user: User) {
    return this.prisma.urlFunction.findMany({
      where: {
        user: {
          id: user.id,
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
  }

  async getCustomFunctionsByUser(user: User) {
    return this.prisma.customFunction.findMany({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }

  private async resolveFunctionName(user: User, name: string | null, context: string, transformTextCase = true, fixDuplicate = false, excludedIds?: number[]) {
    if (name == null) {
      return null;
    }

    if (transformTextCase) {
      name = name.replace(/([\[\]\\/{}()])/g, ' ');
      name = toCamelCase(name);
    }

    if (!fixDuplicate) {
      return name;
    }

    const originalName = name;
    let nameIdentifier = 1;
    while (!await this.checkNameAndContextDuplicates(user, name, context, excludedIds)) {
      name = `${originalName}${nameIdentifier++}`;
      if (nameIdentifier > 100) {
        throw new HttpException(`Failed to create poly function: unambiguous function name`, HttpStatus.BAD_REQUEST);
      }
    }

    return name;
  }

  async findOrCreate(user: User, url: string, method: Method, name: string, description: string, headers: Headers, body: Body, auth?: Auth): Promise<UrlFunction> {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        url,
        method,
      },
    });
    if (urlFunction) {
      this.logger.debug(`Found existing URL function ${urlFunction.id}. Updating...`);
      return this.prisma.urlFunction.update({
        where: {
          id: urlFunction.id,
        },
        data: {
          headers: JSON.stringify(headers),
          body: JSON.stringify(body),
          auth: auth ? JSON.stringify(auth) : null,
        },
      });
    }

    this.logger.debug(`Creating new poly function...`);
    return await this.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      url,
      method,
      name: await this.resolveFunctionName(user, name, '', true, true),
      description,
      context: '',
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
      auth: auth ? JSON.stringify(auth) : null,
    });
  }

  async updateDetails(id: number, user: User, url: string, body: Body, name: string | null, context: string | null, description: string | null, payload: string | null, response: any) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    if (!urlFunction) {
      throw new HttpException(`Poly function not found`, HttpStatus.NOT_FOUND);
    }

    if (!name || !context || !description) {
      const {
        name: aiName,
        description: aiDescription,
        context: aiContext,
      } = await this.aiService.getFunctionDescription(
        url,
        urlFunction.method,
        description || urlFunction.description,
        JSON.stringify(body),
        JSON.stringify(response),
      );

      if (!name) {
        name = aiName;
      }
      if (!context && !urlFunction.context) {
        context = aiContext;
      }
      if (!description && !urlFunction.description) {
        description = aiDescription;
      }
    }

    name = this.normalizeName(name, urlFunction);
    context = this.normalizeContext(context, urlFunction);
    description = this.normalizeDescription(description, urlFunction);
    payload = this.normalizePayload(payload, urlFunction);
    this.logger.debug(`Normalized: name: ${name}, context: ${context}, description: ${description}, payload: ${payload}`);

    try {
      const responseType = await this.commonService.generateContentType(toPascalCase(`${context} ${name} Type`), response, payload);
      this.logger.debug(`Generated response type:\n${responseType}`);

      await this.prisma.urlFunction.update({
        where: {
          id,
        },
        data: {
          name: await this.resolveFunctionName(user, name, context, false, true, [urlFunction.id]),
          context,
          description,
          payload,
          response: JSON.stringify(response),
          responseType,
        },
      });
    } catch (e) {
      if (e instanceof PathError) {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      } else {
        throw e;
      }
    }
  }

  private toArgument(argument: string, argumentTypes: ArgumentTypes): FunctionArgument {
    return {
      name: argument,
      type: argumentTypes[argument] || 'string',
    };
  }

  getArguments(urlFunction: UrlFunction): FunctionArgument[] {
    const toArgument = (arg: string) => this.toArgument(arg, JSON.parse(urlFunction.argumentTypes || '{}'));
    let args = [];

    args = args.concat(urlFunction.url.match(ARGUMENT_PATTERN)?.map(toArgument) || []);
    args = args.concat(urlFunction.headers?.match(ARGUMENT_PATTERN)?.map(toArgument) || []);
    args = args.concat(urlFunction.body?.match(ARGUMENT_PATTERN)?.map(toArgument) || []);
    args = args.concat(urlFunction.auth?.match(ARGUMENT_PATTERN)?.map(toArgument) || []);

    return args || [];
  }

  urlFunctionToDto(urlFunction: UrlFunction): FunctionDto {
    return {
      id: urlFunction.publicId,
      name: urlFunction.name,
      context: urlFunction.context,
      description: urlFunction.description,
      arguments: this.getArguments(urlFunction),
      type: 'url',
    };
  }

  urlFunctionToDefinitionDto(urlFunction: UrlFunction): FunctionDefinitionDto {
    return {
      id: urlFunction.publicId,
      name: urlFunction.name,
      context: urlFunction.context,
      arguments: this.getArguments(urlFunction),
      returnType: urlFunction.responseType,
    };
  }

  customFunctionToDto(customFunction: CustomFunction): FunctionDto {
    return {
      id: customFunction.publicId,
      name: customFunction.name,
      description: customFunction.description,
      context: customFunction.context,
      arguments: JSON.parse(customFunction.arguments),
      type: 'url',
    };
  }

  customFunctionToDefinitionDto(customFunction: CustomFunction): FunctionDefinitionDto {
    return {
      id: customFunction.publicId,
      name: customFunction.name,
      context: customFunction.context,
      arguments: JSON.parse(customFunction.arguments),
      returnType: customFunction.returnType,
      customCode: customFunction.code,
    };
  }

  findByPublicId(publicId: string): Promise<UrlFunction | null> {
    return this.prisma.urlFunction.findFirst({
      where: {
        publicId,
      },
    });
  }

  async executeFunction(urlFunction: UrlFunction, args: any[], clientID: string) {
    this.logger.debug(`Executing function ${urlFunction.id} with arguments ${JSON.stringify(args)}`);

    const functionPath = `${urlFunction.context ? `${urlFunction.context}.` : ''}${urlFunction.name}`;
    const argumentsMap = this.getArgumentsMap(urlFunction, args);
    const url = mustache.render(urlFunction.url, argumentsMap);
    const method = urlFunction.method;
    const auth = urlFunction.auth ? JSON.parse(mustache.render(urlFunction.auth, argumentsMap)) : null;
    const text = mustache.render(urlFunction.body, argumentsMap);
    console.log('%c TEXT', 'background: yellow; color: black', text);
    const body = JSON.parse(text);
    const params = {
      ...this.getAuthorizationQueryParams(auth),
    };
    const headers = {
      ...JSON.parse(mustache.render(urlFunction.headers, argumentsMap))
        .reduce(
          (headers, header) => Object.assign(headers, { [header.key]: header.value }),
          {},
        ),
      ...this.getContentTypeHeaders(body),
      ...this.getAuthorizationHeaders(auth),
    };

    this.logger.debug(`Performing HTTP request ${method} ${url} (id: ${urlFunction.id})...\nHeaders:\n${JSON.stringify(headers)}\nBody:\n${JSON.stringify(body)}`);
    return lastValueFrom(
      this.httpService.request({
        url,
        method,
        headers,
        params,
        data: this.getBodyData(body),
      }).pipe(
        map(response => response.data),
        map(response => {
          try {
            this.logger.debug(`Response (id: ${urlFunction.id}):\n${JSON.stringify(response)}`);
            const payloadResponse = this.commonService.getPathContent(response, urlFunction.payload);
            if (response !== payloadResponse) {
              this.logger.debug(`Payload response (id: ${urlFunction.id}, payload: ${urlFunction.payload}):\n${JSON.stringify(payloadResponse)}`);
            }
            return payloadResponse;
          } catch (e) {
            return response;
          }
        }),
      ).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Error while performing HTTP request (id: ${urlFunction.id}): ${error}`);

          if (this.eventService.sendErrorEvent(clientID, functionPath, this.eventService.getEventError(error))) {
            return of(null);
          }

          if (error.response) {
            throw new HttpException(error.response.data, error.response.status);
          } else {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
          }
        }),
      ),
    );
  }

  private getArgumentsMap(urlFunction: UrlFunction, args: any[]) {
    const normalizeArg = arg => {
      if (typeof arg === 'string') {
        return arg
          .replaceAll('\r\n', '\n')
          .trim();
      } else {
        return arg;
      }
    };

    return this.getArguments(urlFunction)
      .reduce((result, arg, index) => Object.assign(result, { [arg.name]: normalizeArg(args[index]) }), {});
  }

  private getAuthorizationHeaders(auth: Auth | null) {
    if (!auth) {
      return {};
    }

    switch (auth.type) {
      case 'basic': {
        const username = auth.basic.find(item => item.key === 'username')?.value;
        const password = auth.basic.find(item => item.key === 'password')?.value;

        return {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        };
      }
      case 'bearer': {
        const token = auth.bearer.find(item => item.key === 'token')?.value;

        return {
          Authorization: `Bearer ${token}`,
        };
      }
      case 'apikey': {
        const inHeader = auth.apikey.find(item => item.key === 'in')?.value === 'header';
        if (!inHeader) {
          return {};
        }

        const key = auth.apikey.find(item => item.key === 'key')?.value;
        const value = auth.apikey.find(item => item.key === 'value')?.value;

        return {
          [key]: value,
        };
      }
      default:
        this.logger.debug(`Unknown auth type:`, auth);
        return {};
    }
  }

  private getAuthorizationQueryParams(auth: Auth | null) {
    if (!auth) {
      return {};
    }

    switch (auth.type) {
      case 'apikey': {
        const inQuery = auth.apikey.find(item => item.key === 'in')?.value === 'query';
        if (!inQuery) {
          return {};
        }

        const key = auth.apikey.find(item => item.key === 'key')?.value;
        const value = auth.apikey.find(item => item.key === 'value')?.value;

        return {
          [key]: value,
        };
      }
      default:
        return {};
    }
  }

  private getBodyData(body: Body): Record<string, any> | undefined {
    switch (body.mode) {
      case 'raw':
        if (!body.raw?.trim()) {
          return undefined;
        }
        try {
          return JSON.parse(body.raw);
        } catch (e) {
          this.logger.debug(`Error while parsing body: ${e}`);
          return undefined;
        }
      case 'formdata':
        return body.formdata.reduce((data, item) => Object.assign(data, { [item.key]: item.value }), {});
      case 'urlencoded':
        return body.urlencoded.reduce((data, item) => Object.assign(data, { [item.key]: item.value }), {});
      default:
        return undefined;
    }
  }

  private getContentTypeHeaders(body: Body) {
    switch (body.mode) {
      case 'raw':
        return {
          'Content-Type': 'application/json',
        };
      case 'formdata':
        return {
          'Content-Type': 'multipart/form-data',
        };
      case 'urlencoded':
        return {
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      default:
        return {};
    }
  }

  async updateFunction(user: User, publicId: string, name: string | null, context: string | null, description: string | null, argumentTypes: ArgumentTypes | null) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        publicId,
      },
    });
    if (!urlFunction) {
      throw new HttpException(`Function not found.`, HttpStatus.NOT_FOUND);
    }

    if (name != null || context != null) {
      name = await this.resolveFunctionName(user, name, urlFunction.context, false);

      if (!await this.checkNameAndContextDuplicates(
        user,
        name || urlFunction.name,
        context == null
          ? urlFunction.context || ''
          : context,
        [urlFunction.id],
      )) {
        throw new HttpException(`Function with name ${name} and context ${context} already exists.`, HttpStatus.CONFLICT);
      }
    }

    let responseType = null;
    if (urlFunction.response) {
      responseType = await this.commonService.generateContentType(toPascalCase(`${context} ${name} Type`), JSON.parse(urlFunction.response), urlFunction.payload);
      this.logger.debug(`Generated response type:\n${responseType}`);
    }

    this.logger.debug(`Updating function ${urlFunction.id} with name ${name}, context ${context}, description ${description}`);
    return this.prisma.urlFunction.update({
      where: {
        id: urlFunction.id,
      },
      data: {
        name: name || urlFunction.name,
        context: context == null ? urlFunction.context : context,
        description: description == null ? urlFunction.description : description,
        argumentTypes: JSON.stringify(this.resolveArgumentTypes(urlFunction.argumentTypes, argumentTypes)),
        responseType,
      },
    });
  }

  async deleteFunction(user: User, publicId: string) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        publicId,
      },
    });
    if (urlFunction) {
      this.logger.debug(`Deleting URL function ${publicId}`);
      await this.prisma.urlFunction.delete({
        where: {
          publicId,
        },
      });
    }

    const customFunction = await this.prisma.customFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        publicId,
      },
    });
    if (customFunction) {
      this.logger.debug(`Deleting custom function ${publicId}`);
      await this.prisma.customFunction.delete({
        where: {
          publicId,
        },
      });
    }

    throw new HttpException(`Function not found.`, HttpStatus.NOT_FOUND);
  }

  private async checkNameAndContextDuplicates(user: User, name: string, context: string, excludedIds?: number[]) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        name,
        context,
        AND: excludedIds == null
          ? undefined
          : {
            id: {
              notIn: excludedIds,
            },
          },
      },
    });
    if (urlFunction) {
      return false;
    }

    const customFunction = await this.prisma.customFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        name,
        context,
        AND: excludedIds == null
          ? undefined
          : {
            id: {
              notIn: excludedIds,
            },
          },
      },
    });
    if (customFunction) {
      return false;
    }

    return true;
  }

  private normalizeName(name: string | null, urlFunction: UrlFunction) {
    if (name == null) {
      name = urlFunction.name;
    }
    return name;
  }

  private normalizeContext(context: string | null, urlFunction: UrlFunction) {
    if (context == null) {
      context = urlFunction.context;
    }

    return context;
  }

  private normalizeDescription(description: string | null, urlFunction: UrlFunction) {
    if (description == null) {
      description = urlFunction.description;
    }

    return description;
  }

  private normalizePayload(payload: string | null, urlFunction: UrlFunction) {
    if (payload == null) {
      payload = urlFunction.payload;
    } else {
      if (!payload.startsWith('$')) {
        payload = `$${payload.startsWith('[') ? '' : '.'}${payload}`;
      }
    }

    return payload;
  }

  async deleteAllByUser(userID: number) {
    await this.prisma.urlFunction.deleteMany({
      where: {
        user: {
          id: userID,
        },
      },
    });
    await this.prisma.customFunction.deleteMany({
      where: {
        user: {
          id: userID,
        },
      },
    });
  }

  async deleteAllApiKey(apiKey: string) {
    await this.prisma.urlFunction.deleteMany({
      where: {
        user: {
          apiKey,
        },
      },
    });
    await this.prisma.customFunction.deleteMany({
      where: {
        user: {
          apiKey,
        },
      },
    });
  }

  async createCustomFunction(user: User, context: string | null, name: string, code: string) {
    let functionArguments: FunctionArgument[] | null = null;
    let returnType: string | null = null;

    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        noImplicitUseStrict: true,
      },
      fileName: 'customFunction.ts',
      transformers: {
        before: [
          (context) => {
            return (sourceFile) => {
              const visitor = (node: ts.Node): ts.Node => {
                if (ts.isFunctionDeclaration(node)) {
                  if (node.name?.getText() === name) {
                    functionArguments = node.parameters.map(param => ({
                      name: param.name.getText(),
                      type: param.type?.getText() || 'any',
                    }));
                    returnType = node.type?.getText();

                    return ts.visitEachChild(node, visitor, context);
                  }
                }

                return node;
              };

              return ts.visitEachChild(sourceFile, visitor, context);
            };
          },
        ],
      },
    });

    if (!functionArguments) {
      throw new Error(`Function ${name} not found.`);
    }
    if (!returnType) {
      throw new Error(`Return type not specified. Please add return type explicitly to function ${name}.`);
    }

    code = result.outputText;

    const found = await this.prisma.customFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        name,
        context: context || '',
      },
    });
    if (found) {
      this.logger.debug(`Updating custom function ${name} with context ${context} and code:\n${code}`);
      return this.prisma.customFunction.update({
        where: {
          id: found.id,
        },
        data: {
          code,
          arguments: JSON.stringify(functionArguments),
          returnType,
        },
      });
    } else {
      this.logger.debug(`Creating custom function ${name} with context ${context} and code:\n${code}`);
      return this.prisma.customFunction.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          context: context || '',
          name,
          code,
          arguments: JSON.stringify(functionArguments),
          returnType,
        },
      });
    }
  }

  private resolveArgumentTypes(argumentTypes: string | null, updatedArgumentTypes: ArgumentTypes | null) {
    return {
      ...JSON.parse(argumentTypes || '{}'),
      ...updatedArgumentTypes,
    };
  }
}
