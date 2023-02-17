import { Injectable } from '@nestjs/common';
import { Prisma, PolyFunction, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Method, Headers, Body } from 'common/types';

@Injectable()
export class PolyFunctionService {
  constructor(private prisma: PrismaService) {
  }

  create(data: Prisma.PolyFunctionCreateInput): Promise<PolyFunction> {
    return this.prisma.polyFunction.create({ data });
  }

  getAll(): Promise<PolyFunction[]> {
    return this.prisma.polyFunction.findMany();
  }

  async findOrCreate(user: User, url: string, method: Method, alias: string, headers: Headers, body: Body): Promise<PolyFunction> {
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
      return found;
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
      }
    });
  }
}
