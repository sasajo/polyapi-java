import jsonpath from 'jsonpath';
import { quicktype, jsonInputForTargetLanguage, InputData } from 'quicktype-core';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import { HttpService } from '@nestjs/axios';
import { catchError, map } from 'rxjs';
import mustache from 'mustache';
import { PolyFunction, Prisma, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Body, ExecuteFunctionDto, FunctionArgument, FunctionDto, Headers, Method } from '@poly/common';

const ARGUMENT_PATTERN = /(?<=\{\{)([^}]+)(?=\})/g;

@Injectable()
export class PolyFunctionService {
  constructor(private readonly prisma: PrismaService, private readonly httpService: HttpService) {
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

  private getDefaultAlias(method: Method, alias: string) {
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
    alias = this.getDefaultAlias(method, alias);

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
      return;
    }

    alias = this.normalizeAlias(alias, polyFunction);
    context = this.normalizeContext(context, polyFunction);
    payload = this.normalizePayload(payload, polyFunction);

    await this.prisma.polyFunction.update({
      where: {
        id,
      },
      data: {
        alias,
        context,
        payload,
        response: JSON.stringify(response),
        responseType: await this.generateResponseType(toPascalCase(`${context} ${alias} Type`), response, payload),
      },
    });
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
    args = args.concat(polyFunction.headers.match(ARGUMENT_PATTERN)?.map(this.toArgument) || []);
    args = args.concat(polyFunction.body.match(ARGUMENT_PATTERN)?.map(this.toArgument) || []);

    return args || [];
  }

  toDto(polyFunction: PolyFunction): FunctionDto {
    return {
      id: polyFunction.publicId,
      name: polyFunction.alias,
      context: polyFunction.context,
      arguments: this.getArguments(polyFunction),
      returnType: polyFunction.responseType || 'Promise<any>',
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
    const args = this.getArguments(polyFunction)
      .reduce((args, arg, index) => Object.assign(args, { [arg.name]: executeFunctionDto.args[index] }), {});
    const headers = JSON.parse(mustache.render(polyFunction.headers, args));
    const body = JSON.parse(mustache.render(polyFunction.body, args));

    return this.httpService.request({
      url: mustache.render(polyFunction.url, args),
      method: polyFunction.method,
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
          return this.getPayloadResponse(response, polyFunction.payload);
        } catch (e) {
          return response;
        }
      }),
    ).pipe(
      catchError(error => {
          throw new HttpException(error.response.data, error.response.status);
        },
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

  private async generateResponseType(typeName: string, response: unknown, payload: string | null) {
    if (!response) {
      return '';
    }

    try {
      response = this.getPayloadResponse(response, payload);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }

    const jsonInput = jsonInputForTargetLanguage('ts');
    await jsonInput.addSource({
      name: typeName,
      samples: [JSON.stringify({
        response,
      })],
    });
    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const { lines } = await quicktype({
      lang: 'ts',
      inputData,
      combineClasses: true,
      rendererOptions: {
        'just-types': 'true',
      },
    });

    return lines
      .map(line => line.replace('response: Response', `response: ${typeName}Response`))
      .map(line => line.replace('export interface', 'interface'))
      .map(line => line.replace('interface Response', `interface ${typeName}Response`))
      .join('\n');
  }

  private getPayloadResponse(response: unknown, payload: string | null): unknown {
    if (!payload) {
      return response;
    }

    try {
      const result = jsonpath.query(response, payload);
      if (payload.includes('[*]')) {
        return result;
      } else if (result.length === 0) {
        return null;
      } else {
        return result[0];
      }
    } catch (e) {
      throw new Error(`Invalid payload ${payload}`);
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
