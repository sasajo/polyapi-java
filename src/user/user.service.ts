import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
  }

  public async findByApiKey(apiKey: string): Promise<User | null> {
    if (!apiKey) {
      return null;
    }

    return this.prisma.user.findFirst({
      where: {
        apiKey,
      },
    });
  }

  public async getPublicUser(): Promise<User> {
    const publicUser = await this.prisma.user.findFirst({
      where: {
        apiKey: '',
      },
    });
    if (publicUser) {
      return publicUser;
    }

    return this.prisma.user.create({
      data: {
        apiKey: '',
        name: 'publicUser',
      },
    });
  }
}
