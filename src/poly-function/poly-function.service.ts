import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { toCamelCase } from '@guanghechen/helper-string';
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

    console.log('%c DEFAULT ALIAS', 'background: yellow; color: black', alias);
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
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
    });
  }

  async updateDetails(id: number, user: User, functionAlias: string | null, context: string | null, response: unknown) {
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

    await this.prisma.polyFunction.update({
      where: {
        id,
      },
      data: {
        alias: functionAlias == null ? polyFunction.alias : functionAlias,
        context: context == null ? polyFunction.context : context,
        response: JSON.stringify(response),
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
      returnType: 'void',
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

    return this.httpService.request({
      url: mustache.render(polyFunction.url, args),
      method: polyFunction.method,
      headers: JSON.parse(mustache.render(polyFunction.headers, args))
        .reduce(
          (headers, header) => Object.assign(headers, { [header.key]: header.value }),
          {},
        ),
      data: JSON.parse(mustache.render(polyFunction.body, args)),
    }).pipe(
      map(response => response.data),
    ).pipe(
      catchError(error => {
          throw new HttpException(error.response.data, error.response.status);
        },
      ),
    );
  }
}
