import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import mustache from 'mustache';
import { PolyFunction, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Body, ExecuteFunctionDto, FunctionArgument, FunctionDto, Headers, Method } from '@poly/common';
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
    private readonly eventService: EventService
  ) {
  }

  create(data: Prisma.PolyFunctionCreateInput): Promise<PolyFunction> {
    return this.prisma.polyFunction.create({ data });
  }

  async getAllByUser(user: User) {
    return this.prisma.polyFunction.findMany({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }

  getAll(): Promise<PolyFunction[]> {
    return this.prisma.polyFunction.findMany();
  }

  private resolveAlias(method: Method, alias: string) {
    switch (method) {
      case 'GET':
        return toCamelCase(
          alias.toLowerCase().startsWith('get')
            ? alias
            : `get ${alias}`,
        );
      case 'POST':
        return toCamelCase(
          alias.toLowerCase().startsWith('post') || alias.toLowerCase().startsWith('set')
            ? alias
            : `set ${alias}`,
        );
      case 'PUT':
        return toCamelCase(
          alias.toLowerCase().startsWith('put') || alias.toLowerCase().startsWith('set') || alias.toLowerCase().startsWith('update')
            ? alias
            : `set ${alias}`,
        );
      case 'DELETE':
        return toCamelCase(
          alias.toLowerCase().startsWith('delete') || alias.toLowerCase().startsWith('remove')
            ? alias
            : `remove ${alias}`,
        );
      case 'PATCH':
        return toCamelCase(
          alias.toLowerCase().startsWith('update') || alias.toLowerCase().startsWith('set')
            ? alias
            : `update ${alias}`,
        );
      default:
        return toCamelCase(alias);
    }
  }

  async findOrCreate(user: User, url: string, method: Method, alias: string, headers: Headers, body: Body): Promise<PolyFunction> {
    alias = this.resolveAlias(method, alias);

    const found = await this.prisma.polyFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        url,
        method,
      },
    });
    if (found) {
      this.logger.debug(`Found existing poly function ${found.id}. Updating...`);
      return this.prisma.polyFunction.update({
        where: {
          id: found.id,
        },
        data: {
          headers: JSON.stringify(headers),
          body: JSON.stringify(body),
          alias,
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
      alias,
      context: '',
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
    });
  }

  async updateDetails(id: number, user: User, alias: string | null, context: string | null, payload: string | null, response: unknown) {
    const polyFunction = await this.prisma.polyFunction.findFirst({
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    if (!polyFunction) {
      throw new HttpException(`Poly function not found`, HttpStatus.NOT_FOUND);
    }

    alias = this.normalizeAlias(alias, polyFunction);
    context = this.normalizeContext(context, polyFunction);
    payload = this.normalizePayload(payload, polyFunction);
    this.logger.debug(`Normalized: alias: ${alias}, context: ${context}, payload: ${payload}`);

    try {
      const responseType = await this.commonService.generateContentType(toPascalCase(`${context} ${alias} Type`), response, payload);
      this.logger.debug(`Generated response type:\n${responseType}`);

      await this.prisma.polyFunction.update({
        where: {
          id,
        },
        data: {
          alias,
          context,
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

  private toArgument(argument: string): FunctionArgument {
    return {
      name: argument,
      type: 'string', // TODO: support other types
    };
  }

  getArguments(polyFunction: PolyFunction): FunctionArgument[] {
    let args = [];

    args = args.concat(polyFunction.url.match(ARGUMENT_PATTERN)?.map(this.toArgument) || []);
    args = args.concat(polyFunction.headers?.match(ARGUMENT_PATTERN)?.map(this.toArgument) || []);
    args = args.concat(polyFunction.body?.match(ARGUMENT_PATTERN)?.map(this.toArgument) || []);

    return args || [];
  }

  toDto(polyFunction: PolyFunction): FunctionDto {
    return {
      id: polyFunction.publicId,
      name: polyFunction.alias,
      context: polyFunction.context,
      arguments: this.getArguments(polyFunction),
      returnType: polyFunction.responseType,
    };
  }

  async executeFunction(publicId: string, executeFunctionDto: ExecuteFunctionDto) {
    const polyFunction = await this.prisma.polyFunction.findFirst({
      where: {
        publicId,
      },
    });
    if (!polyFunction) {
      throw new HttpException(`Function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }
    this.logger.debug(`Executing function ${polyFunction.id} with arguments ${JSON.stringify(executeFunctionDto.args)}`);

    const args = this.getArguments(polyFunction)
      .reduce((args, arg, index) => Object.assign(args, { [arg.name]: executeFunctionDto.args[index] }), {});
    const headers = JSON.parse(mustache.render(polyFunction.headers, args));
    const body = JSON.parse(mustache.render(polyFunction.body, args));
    const url = mustache.render(polyFunction.url, args);
    const method = polyFunction.method;
    const functionPath = `${polyFunction.context ? `${polyFunction.context}.` : ''}${polyFunction.alias}`;

    this.logger.debug(`Performing HTTP request ${method} ${url} (id: ${polyFunction.id})...\nHeaders:\n${JSON.stringify(headers)}\nBody:\n${JSON.stringify(body)}`);
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
            this.logger.debug(`Response (id: ${polyFunction.id}):\n${JSON.stringify(response)}`);
            const payloadResponse = this.commonService.getPathContent(response, polyFunction.payload);
            if (response !== payloadResponse) {
              this.logger.debug(`Payload response (id: ${polyFunction.id}, payload: ${polyFunction.payload}):\n${JSON.stringify(payloadResponse)}`);
            }
            return payloadResponse;
          } catch (e) {
            return response;
          }
        }),
      ).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Error while performing HTTP request (id: ${polyFunction.id}): ${error}`);

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

  async updateFunction(user: User, id: number, alias: string | null, context: string | null) {
    const found = await this.prisma.polyFunction.findFirst({
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

    this.checkAliasAndContextDuplicates(user, alias || found.alias, context == null ? found.context || '' : context);

    this.logger.debug(`Updating function ${id} with alias ${alias} and context ${context}`);
    return this.prisma.polyFunction.update({
      where: {
        id,
      },
      data: {
        alias: alias || found.alias,
        context: context == null ? found.context : context,
      },
    });
  }

  async deleteFunction(user: User, id: number) {
    const found = await this.prisma.polyFunction.findFirst({
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
    await this.prisma.polyFunction.delete({
      where: {
        id,
      },
    });
  }

  private checkAliasAndContextDuplicates(user: User, alias: string, context: string) {
    const found = this.prisma.polyFunction.findFirst({
      where: {
        user: {
          id: user.id,
        },
        alias,
        context,
      },
    });
    if (found) {
      throw new HttpException(`Function with alias ${alias} and context ${context} already exists.`, HttpStatus.BAD_REQUEST);
    }
  }

  private normalizeAlias(alias: string | null, polyFunction: PolyFunction) {
    if (alias == null) {
      alias = polyFunction.alias;
    }
    return alias;
  }

  private normalizeContext(context: string | null, polyFunction: PolyFunction) {
    if (context == null) {
      context = polyFunction.context;
    }

    return context;
  }

  private normalizePayload(payload: string | null, polyFunction: PolyFunction) {
    if (payload == null) {
      payload = polyFunction.payload;
    } else {
      if (!payload.startsWith('$')) {
        payload = `$${payload.startsWith('[') ? '' : '.'}${payload}`;
      }
    }

    return payload;
  }
}
