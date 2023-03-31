import ts from 'typescript';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import mustache from 'mustache';
import merge from 'lodash/merge';
import { CustomFunction, Prisma, SystemPrompt, UrlFunction, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  ArgumentsMetadata,
  Auth,
  Body,
  FunctionArgument,
  FunctionDefinitionDto,
  FunctionDto,
  Headers,
  Method,
  Role, Variables,
} from '@poly/common';
import { EventService } from 'event/event.service';
import { AxiosError } from 'axios';
import { CommonService } from 'common/common.service';
import { PathError } from 'common/path-error';
import { ConfigService } from 'config/config.service';
import { AiService } from 'ai/ai.service';

const ARGUMENT_PATTERN = /(?<=\{\{)([^}]+)(?=\})/g;
const ARGUMENT_TYPE_SUFFIX = 'ArgumentType';

mustache.escape = (text) => {
  if (typeof text === 'string') {
    return text.replace(/"/g, `\\"`);
  } else {
    return text;
  }
};

@Injectable()
export class FunctionService {
  private logger: Logger = new Logger(FunctionService.name);

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

  private getFunctionFilterConditions(contexts?: string[], names?: string[], ids?: string[]) {
    const filterConditions = [
      contexts?.length ? { context: { in: contexts } } : undefined,
      names?.length ? { name: { in: names } } : undefined,
      ids?.length ? { publicId: { in: ids } } : undefined,
    ].filter(Boolean);

    this.logger.debug(`filterConditions: ${JSON.stringify(filterConditions)}`);

    return filterConditions.length > 0 ? { OR: filterConditions } : undefined;
  }

  async getUrlFunctionsByUser(user: User, contexts?: string[], names?: string[], ids?: string[]) {
    return this.prisma.urlFunction.findMany({
      where: {
        // TODO: temporary returning all functions from all users (https://github.com/polyapi/poly-alpha/issues/122)
        // user: {
        //   id: user.id,
        // },
        ...this.getFunctionFilterConditions(contexts, names, ids),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async getCustomFunctionsByUser(user: User, contexts?: string[], names?: string[], ids?: string[]) {
    return this.prisma.customFunction.findMany({
      where: {
        // TODO: temporary returning all functions from all users (https://github.com/polyapi/poly-alpha/issues/122)
        // user: {
        //   id: user.id,
        // },
        ...this.getFunctionFilterConditions(contexts, names, ids),
      },
    });
  }

  private async resolveFunctionName(
    user: User,
    name: string | null,
    context: string,
    transformTextCase = true,
    fixDuplicate = false,
    excludedIds?: number[],
  ) {
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
    while (!(await this.checkNameAndContextDuplicates(user, name, context, excludedIds))) {
      name = `${originalName}${nameIdentifier++}`;
      if (nameIdentifier > 100) {
        throw new HttpException(`Failed to create poly function: unambiguous function name`, HttpStatus.BAD_REQUEST);
      }
    }

    return name;
  }

  async findOrCreate(
    user: User,
    url: string,
    method: Method,
    name: string,
    description: string,
    headers: Headers,
    body: Body,
    auth?: Auth,
  ): Promise<UrlFunction> {
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

  async updateDetails(
    id: number,
    user: User,
    url: string,
    body: Body,
    name: string | null,
    context: string | null,
    description: string | null,
    payload: string | null,
    response: any,
    variables: Variables,
  ) {
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
    this.logger.debug(
      `Normalized: name: ${name}, context: ${context}, description: ${description}, payload: ${payload}`,
    );

    try {
      const content = this.commonService.getPathContent(response, payload);
      const responseType = await this.commonService.generateTypeDeclaration(
        'ResponseType',
        content,
        toPascalCase(`${context} ${name}`),
      );
      this.logger.debug(`Generated response type:\n${responseType}`);
    } catch (e) {
      if (e instanceof PathError) {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      } else {
        throw e;
      }
    }

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
        argumentsMetadata: await this.resolveArgumentsMetadata(urlFunction, variables),
      },
    });
  }

  private toArgument(argument: string, argumentsMetadata: ArgumentsMetadata, withDefinition = false): FunctionArgument {
    const arg: FunctionArgument = {
      key: argument,
      name: argumentsMetadata[argument]?.name || argument,
      type: argumentsMetadata[argument]?.type || 'string',
      payload: argumentsMetadata[argument]?.payload || false,
    };
    if (withDefinition) {
      arg.typeDeclarations = argumentsMetadata[argument]?.typeDeclarations;
    } else {
      if (arg.type.endsWith(ARGUMENT_TYPE_SUFFIX)) {
        arg.type = 'object';
      }
    }
    return arg;
  }

  getFunctionArguments(urlFunction: UrlFunction, withDefinition = false): FunctionArgument[] {
    const toArgument = (arg: string) => this.toArgument(arg, JSON.parse(urlFunction.argumentsMetadata || '{}'), withDefinition);
    const args: FunctionArgument[] = [];

    args.push(...(urlFunction.url.match(ARGUMENT_PATTERN)?.map(toArgument) || []));
    args.push(...(urlFunction.headers?.match(ARGUMENT_PATTERN)?.map(toArgument) || []));
    args.push(...(urlFunction.body?.match(ARGUMENT_PATTERN)?.map(toArgument) || []));
    args.push(...(urlFunction.auth?.match(ARGUMENT_PATTERN)?.map(toArgument) || []));

    return args;
  }

  urlFunctionToDto(urlFunction: UrlFunction): FunctionDto {
    return {
      id: urlFunction.publicId,
      name: urlFunction.name,
      context: urlFunction.context,
      description: urlFunction.description,
      arguments: this.getFunctionArguments(urlFunction),
      type: 'url',
    };
  }

  async urlFunctionToDefinitionDto(urlFunction: UrlFunction): Promise<FunctionDefinitionDto> {
    const returnTypeName = 'ReturnType';
    const content = this.commonService.getPathContent(JSON.parse(urlFunction.response), urlFunction.payload);
    const namespace = toPascalCase(urlFunction.name);
    const returnType = await this.commonService.generateTypeDeclaration(
      returnTypeName,
      content,
      namespace
    );

    return {
      id: urlFunction.publicId,
      name: urlFunction.name,
      description: urlFunction.description,
      context: urlFunction.context,
      arguments: this.getFunctionArguments(urlFunction, true),
      returnTypeName: `Promise<${namespace}.${returnTypeName}>`,
      returnType,
    };
  }

  customFunctionToDto(customFunction: CustomFunction): FunctionDto {
    return {
      id: customFunction.publicId,
      name: customFunction.name,
      description: customFunction.description,
      context: customFunction.context,
      arguments: JSON.parse(customFunction.arguments),
      type: 'custom',
    };
  }

  customFunctionToDefinitionDto(customFunction: CustomFunction): FunctionDefinitionDto {
    return {
      id: customFunction.publicId,
      name: customFunction.name,
      description: customFunction.description,
      context: customFunction.context,
      arguments: JSON.parse(customFunction.arguments),
      returnType: customFunction.returnType,
      returnTypeName: customFunction.returnType,
      customCode: customFunction.code,
    };
  }

  findUrlFunctionByPublicId(publicId: string): Promise<UrlFunction | null> {
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
    const body = JSON.parse(text);
    const params = {
      ...this.getAuthorizationQueryParams(auth),
    };
    const headers = {
      ...JSON.parse(mustache.render(urlFunction.headers, argumentsMap)).reduce(
        (headers, header) => Object.assign(headers, { [header.key]: header.value }),
        {},
      ),
      ...this.getContentTypeHeaders(body),
      ...this.getAuthorizationHeaders(auth),
    };

    this.logger.debug(
      `Performing HTTP request ${method} ${url} (id: ${urlFunction.id})...\nHeaders:\n${JSON.stringify(
        headers,
      )}\nBody:\n${JSON.stringify(body)}`,
    );
    return lastValueFrom(
      this.httpService
        .request({
          url,
          method,
          headers,
          params,
          data: this.getBodyData(body),
        })
        .pipe(
          map((response) => response.data),
          map((response) => {
            try {
              this.logger.debug(`Response (id: ${urlFunction.id}):\n${JSON.stringify(response)}`);
              const payloadResponse = this.commonService.getPathContent(response, urlFunction.payload);
              if (response !== payloadResponse) {
                this.logger.debug(
                  `Payload response (id: ${urlFunction.id}, payload: ${urlFunction.payload}):\n${JSON.stringify(
                    payloadResponse,
                  )}`,
                );
              }
              return payloadResponse;
            } catch (e) {
              return response;
            }
          }),
        )
        .pipe(
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
    const normalizeArg = (arg: any) => {
      if (typeof arg === 'string') {
        return arg.replaceAll('\r\n', '\n').trim();
      } else {
        return arg;
      }
    };

    const functionArgs = this.getFunctionArguments(urlFunction);
    const getPayloadArgs = () => {
      const payloadArgs = functionArgs.filter((arg) => arg.payload);
      if (payloadArgs.length === 0) {
        return {};
      }
      const payload = args[args.length - 1];
      if (typeof payload !== 'object') {
        this.logger.debug(`Expecting payload as object, but it is not: ${JSON.stringify(payload)}`);
        return {};
      }
      return payloadArgs.reduce(
        (result, arg) => Object.assign(result, { [arg.key]: normalizeArg(payload[toCamelCase(arg.name)]) }),
        {},
      );
    };

    return {
      ...functionArgs
        .filter((arg) => !arg.payload)
        .reduce(
          (result, arg, index) => Object.assign(result, { [arg.key]: normalizeArg(args[index]) }),
          {},
        ),
      ...getPayloadArgs(),
    };
  }

  private getAuthorizationHeaders(auth: Auth | null) {
    if (!auth) {
      return {};
    }

    switch (auth.type) {
      case 'basic': {
        const username = auth.basic.find((item) => item.key === 'username')?.value;
        const password = auth.basic.find((item) => item.key === 'password')?.value;

        return {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        };
      }
      case 'bearer': {
        const token = auth.bearer.find((item) => item.key === 'token')?.value;

        return {
          Authorization: `Bearer ${token}`,
        };
      }
      case 'apikey': {
        const inHeader = auth.apikey.find((item) => item.key === 'in')?.value === 'header';
        if (!inHeader) {
          return {};
        }

        const key = auth.apikey.find((item) => item.key === 'key')?.value;
        const value = auth.apikey.find((item) => item.key === 'value')?.value;

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
        const inQuery = auth.apikey.find((item) => item.key === 'in')?.value === 'query';
        if (!inQuery) {
          return {};
        }

        const key = auth.apikey.find((item) => item.key === 'key')?.value;
        const value = auth.apikey.find((item) => item.key === 'value')?.value;

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

  async findUrlFunction(user: User, publicId: string) {
    return this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        publicId,
      },
    });
  }

  async findCustomFunction(user: User, publicId: string) {
    return this.prisma.customFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        publicId,
      },
    });
  }

  async updateUrlFunction(user: User, urlFunction: UrlFunction, name: string | null, context: string | null, description: string | null, argumentsMetadata: ArgumentsMetadata | null) {
    if (name != null || context != null) {
      name = await this.resolveFunctionName(user, name, urlFunction.context, false);

      if (
        !(await this.checkNameAndContextDuplicates(
          user,
          name || urlFunction.name,
          context == null ? urlFunction.context || '' : context,
          [urlFunction.id],
        ))
      ) {
        throw new HttpException(
          `Function with name ${name} and context ${context} already exists.`,
          HttpStatus.CONFLICT,
        );
      }
    }

    argumentsMetadata = this.mergeAndCheckArgumentsMetadata(urlFunction.argumentsMetadata, argumentsMetadata);

    const duplicatedArgumentName = this.findDuplicatedArgumentName(this.getFunctionArguments({
      ...urlFunction,
      argumentsMetadata: JSON.stringify(argumentsMetadata),
    }));
    if (duplicatedArgumentName) {
      throw new HttpException(
        `Function has duplicated arguments: ${duplicatedArgumentName}`,
        HttpStatus.CONFLICT,
      );
    }

    this.logger.debug(`Updating URL function ${urlFunction.id} with name ${name}, context ${context}, description ${description}`);
    return this.prisma.urlFunction.update({
      where: {
        id: urlFunction.id,
      },
      data: {
        name: name || urlFunction.name,
        context: context == null ? urlFunction.context : context,
        description: description == null ? urlFunction.description : description,
        argumentsMetadata: JSON.stringify(argumentsMetadata),
      },
    });
  }

  async updateCustomFunction(user: User, customFunction: CustomFunction, context: string | null, description: string | null) {
    const { id, name } = customFunction;

    if (context != null) {
      if (!await this.checkNameAndContextDuplicates(
        user,
        name,
        context,
        [id],
      )) {
        throw new HttpException(`Function with name ${name} and context ${context} already exists.`, HttpStatus.CONFLICT);
      }
    }

    this.logger.debug(`Updating custom function ${id} with name ${name}, context ${context}, description ${description}`);
    return this.prisma.customFunction.update({
      where: {
        id,
      },
      data: {
        context: context == null ? customFunction.context : context,
        description: description == null ? customFunction.description : description,
      },
    });
  }

  async deleteFunction(user: User, publicId: string) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        publicId,
      },
    });
    if (urlFunction) {
      if (user.role !== Role.Admin && urlFunction.userId !== user.id) {
        throw new HttpException(`You don't have permission to delete this function.`, HttpStatus.FORBIDDEN);
      }

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
      if (user.role !== Role.Admin && customFunction.userId !== user.id) {
        throw new HttpException(`You don't have permission to delete this function.`, HttpStatus.FORBIDDEN);
      }

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
        AND:
          excludedIds == null
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
        AND:
          excludedIds == null
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
                    functionArguments = node.parameters.map((param) => ({
                      key: param.name.getText(),
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

  private mergeAndCheckArgumentsMetadata(argumentsMetadata: string | null, updatedArgumentsMetadata: ArgumentsMetadata | null) {
    const resolvedArgumentsMetadata: ArgumentsMetadata = merge(
      JSON.parse(argumentsMetadata || '{}'),
      updatedArgumentsMetadata,
    );
    const checkNameDuplicates = () => {
      const names = new Set<string>();
      Object.entries(resolvedArgumentsMetadata).forEach(([key, data]) => {
        const name = toCamelCase(data.name || key);
        if (names.has(name)) {
          throw new HttpException(
            `Duplicate argument name ${name} in function arguments. Please use unique names.`,
            HttpStatus.CONFLICT,
          );
        }
        names.add(name);
      });
    };

    checkNameDuplicates();

    return resolvedArgumentsMetadata;
  }

  async setSystemPrompt(userId: number, prompt: string): Promise<SystemPrompt> {
    // clear the conversation so the user can test the new system prompt!
    this.aiService.clearConversation(userId.toString());

    const systemPrompt = await this.prisma.systemPrompt.findFirst({ orderBy: { createdAt: 'desc' } });
    if (systemPrompt) {
      this.logger.debug(`Found existing SystemPrompt ${systemPrompt.id}. Updating...`);
      return this.prisma.systemPrompt.update({
        where: {
          id: systemPrompt.id,
        },
        data: {
          content: prompt,
        },
      });
    }

    this.logger.debug(`Creating new SystemPrompt...`);
    return this.prisma.systemPrompt.create({
      data: {
        userId: userId,
        content: prompt,
      },
    });
  }

  private findDuplicatedArgumentName(args: FunctionArgument[]) {
    const names = new Set<string>();

    for (const argument of args) {
      const name = toCamelCase(argument.name);
      if (names.has(name)) {
        return name;
      }
      names.add(name);
    }
    return null;
  }

  private async resolveArgumentsMetadata(urlFunction: UrlFunction, variables: Variables) {
    const functionArgs = this.getFunctionArguments(urlFunction);
    const metadata: ArgumentsMetadata = JSON.parse(urlFunction.argumentsMetadata || '{}');

    const resolveArgumentParameterLimit = () => {
      if (urlFunction.argumentsMetadata || functionArgs.length <= this.config.functionArgsParameterLimit) {
        return;
      }
      this.logger.debug(`Generating arguments metadata for function ${urlFunction.id} with payload 'true' (arguments count: ${functionArgs.length})`);
      functionArgs.forEach(arg => {
        if (metadata[arg.key]) {
          metadata[arg.key].payload = true;
        } else {
          metadata[arg.key] = {
            payload: true,
          };
        }
      });
    };
    const resolveArgumentTypes = async () => {
      this.logger.debug(`Resolving argument types for function ${urlFunction.id}...`);
      for (const arg of functionArgs) {
        if (metadata[arg.key]?.type) {
          continue;
        }
        const value = variables[arg.key];
        if (value == null) {
          continue;
        }

        const [type, typeDeclarations] = await this.commonService.resolveType(
          'Argument',
          `${toPascalCase(urlFunction.name)}$${toPascalCase(arg.key)}`,
          value,
        );

        if (metadata[arg.key]) {
          metadata[arg.key].type = type;
          metadata[arg.key].typeDeclarations = typeDeclarations;
        } else {
          metadata[arg.key] = {
            type,
            typeDeclarations,
          };
        }
      }
    };

    resolveArgumentParameterLimit();
    await resolveArgumentTypes();

    return JSON.stringify(metadata);
  }
}
