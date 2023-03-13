import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import mustache from 'mustache';
import { UrlFunction, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ArgumentTypes, Body, ExecuteFunctionDto, FunctionArgument, FunctionDto, Headers, Method } from '@poly/common';
import { EventService } from 'event/event.service';
import { AxiosError } from 'axios';
import { CommonService } from 'common/common.service';
import { PathError } from 'common/path-error';
import { ConfigService } from 'config/config.service';

const ARGUMENT_PATTERN = /(?<=\{\{)([^}]+)(?=\})/g;

@Injectable()
export class PolyFunctionService {
  private logger: Logger = new Logger(PolyFunctionService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly eventService: EventService,
  ) {
  }

  create(data: Prisma.UrlFunctionCreateInput): Promise<UrlFunction> {
    return this.prisma.urlFunction.create({ data });
  }

  async getAllByUser(user: User) {
    return this.prisma.urlFunction.findMany({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }

  getAll(): Promise<UrlFunction[]> {
    return this.prisma.urlFunction.findMany();
  }

  private async resolveAlias(user: User, alias: string | null, context: string, fixDuplicate = false, excludedIds?: number[]) {
    if (alias == null) {
      return null;
    }
    alias = alias.replace(/([\[\]{}()])/g, ' ');
    alias = toCamelCase(alias);

    if (!fixDuplicate) {
      return alias;
    }

    const originalAlias = alias;
    let nameIdentifier = 1;
    while (!await this.checkAliasAndContextDuplicates(user, alias, context, excludedIds)) {
      alias = `${originalAlias}-${nameIdentifier++}`;
      if (nameIdentifier > 100) {
        throw new HttpException(`Failed to create poly function: unambiguous function alias`, HttpStatus.BAD_REQUEST);
      }
    }

    return alias;
  }

  async findOrCreate(user: User, url: string, method: Method, alias: string, headers: Headers, body: Body): Promise<UrlFunction> {
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
      this.logger.debug(`Found existing poly function ${urlFunction.id}. Updating...`);
      return this.prisma.urlFunction.update({
        where: {
          id: urlFunction.id,
        },
        data: {
          headers: JSON.stringify(headers),
          body: JSON.stringify(body),
          alias: await this.resolveAlias(user, alias, urlFunction.context, true, [urlFunction.id]),
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
      alias: await this.resolveAlias(user, alias, '', true),
      context: '',
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
    });
  }

  async updateDetails(id: number, user: User, alias: string | null, context: string | null, description: string | null, payload: string | null, response: unknown) {
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

    alias = this.normalizeAlias(alias, urlFunction);
    context = this.normalizeContext(context, urlFunction);
    description = this.normalizeDescription(description, urlFunction);
    payload = this.normalizePayload(payload, urlFunction);
    this.logger.debug(`Normalized: alias: ${alias}, context: ${context}, description: ${description}, payload: ${payload}`);

    try {
      const responseType = await this.commonService.generateContentType(toPascalCase(`${context} ${alias} Type`), response, payload);
      this.logger.debug(`Generated response type:\n${responseType}`);

      await this.prisma.urlFunction.update({
        where: {
          id,
        },
        data: {
          alias,
          context,
          description,
          payload,
          response: JSON.stringify(response),
          responseType: responseType,
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

    return args || [];
  }

  toDto(urlFunction: UrlFunction): FunctionDto {
    return {
      id: urlFunction.publicId,
      name: urlFunction.alias,
      context: urlFunction.context,
      arguments: this.getArguments(urlFunction),
      returnType: urlFunction.responseType,
    };
  }

  async executeFunction(publicId: string, executeFunctionDto: ExecuteFunctionDto) {
    const urlFunction = await this.prisma.urlFunction.findFirst({
      where: {
        publicId,
      },
    });
    if (!urlFunction) {
      throw new HttpException(`Function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }
    this.logger.debug(`Executing function ${urlFunction.id} with arguments ${JSON.stringify(executeFunctionDto.args)}`);

    const args = this.getArguments(urlFunction)
      .reduce((args, arg, index) => Object.assign(args, { [arg.name]: executeFunctionDto.args[index] }), {});
    const headers = JSON.parse(mustache.render(urlFunction.headers, args));
    const body = JSON.parse(mustache.render(urlFunction.body, args));
    const url = mustache.render(urlFunction.url, args);
    const method = urlFunction.method;
    const functionPath = `${urlFunction.context ? `${urlFunction.context}.` : ''}${urlFunction.alias}`;

    this.logger.debug(`Performing HTTP request ${method} ${url} (id: ${urlFunction.id})...\nHeaders:\n${JSON.stringify(headers)}\nBody:\n${JSON.stringify(body)}`);
    return lastValueFrom(
      this.httpService.request({
        url,
        method,
        headers: headers
          .reduce(
            (headers, header) => Object.assign(headers, { [header.key]: header.value }),
            this.getDefaultHeaders(body),
          ),
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

          if (this.eventService.sendErrorEvent(executeFunctionDto.clientID, functionPath, this.eventService.getEventError(error))) {
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

  private getBodyData(body: Body): Record<string, any> | undefined {
    switch (body.mode) {
      case 'raw':
        return JSON.parse(body.raw);
      case 'formdata':
        return body.formdata.reduce((data, item) => Object.assign(data, { [item.key]: item.value }), {});
      case 'urlencoded':
        return body.urlencoded.reduce((data, item) => Object.assign(data, { [item.key]: item.value }), {});
      default:
        return undefined;
    }
  }

  private getDefaultHeaders(body: Body) {
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

  async updateFunction(user: User, publicId: string, alias: string | null, context: string | null, description: string | null, argumentTypes: ArgumentTypes | null) {
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

    if (alias != null || context != null) {
      alias = await this.resolveAlias(user, alias, urlFunction.context);
      console.log('%c RESOLVED', 'background: yellow; color: black', alias);

      if (!await this.checkAliasAndContextDuplicates(
        user,
        alias || urlFunction.alias,
        context == null
          ? urlFunction.context || ''
          : context,
        [urlFunction.id],
      )) {
        throw new HttpException(`Function with alias ${alias} and context ${context} already exists.`, HttpStatus.CONFLICT);
      }
    }

    this.logger.debug(`Updating function ${urlFunction.id} with alias ${alias}, context ${context}, description ${description}`);
    return this.prisma.urlFunction.update({
      where: {
        id: urlFunction.id,
      },
      data: {
        alias: alias || urlFunction.alias,
        context: context == null ? urlFunction.context : context,
        description: description == null ? urlFunction.description : description,
        argumentTypes: JSON.stringify(this.resolveArgumentTypes(urlFunction.argumentTypes, argumentTypes)),
      },
    });
  }

  async deleteFunction(user: User, id: number) {
    const found = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        id,
      },
    });
    if (!found) {
      throw new HttpException(`Function not found.`, HttpStatus.NOT_FOUND);
    }

    this.logger.debug(`Deleting function ${id}`);
    await this.prisma.urlFunction.delete({
      where: {
        id,
      },
    });
  }

  private async checkAliasAndContextDuplicates(user: User, alias: string, context: string, excludedIds?: number[]) {
    const found = await this.prisma.urlFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        alias,
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

    return !found;
  }

  private normalizeAlias(alias: string | null, urlFunction: UrlFunction) {
    if (alias == null) {
      alias = urlFunction.alias;
    }
    return alias;
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
    return this.prisma.urlFunction.deleteMany({
      where: {
        user: {
          id: userID,
        },
      },
    });
  }

  async deleteAllApiKey(apiKey: string) {
    return this.prisma.urlFunction.deleteMany({
      where: {
        user: {
          apiKey,
        },
      },
    });
  }

  private resolveArgumentTypes(argumentTypes: string | null, updatedArgumentTypes: ArgumentTypes | null) {
    return {
      ...JSON.parse(argumentTypes || '{}'),
      ...updatedArgumentTypes,
    };
  }
}
