import crypto from 'crypto';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from 'config/config.service';
import { Role } from '@poly/common';

const PUBLIC_USER_NAME = 'publicUser';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
  }

  async onModuleInit() {
    await this.checkAdmin();
  }

  private async checkAdmin() {
    const admin = await this.prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (!admin) {
      await this.prisma.user.create({
        data: {
          name: 'admin',
          role: Role.Admin,
          apiKey: this.config.adminApiKey,
        },
      });
    } else if (admin.apiKey !== this.config.adminApiKey) {
      await this.prisma.user.update({
        where: {
          id: admin.id,
        },
        data: {
          apiKey: this.config.adminApiKey,
        },
      });
    }
  }

  async createUser(name: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        name,
      },
    });
    if (existingUser) {
      throw new BadRequestException('User with such name already exists.');
    }

    return this.prisma.user.create({
      data: {
        name,
        role: Role.User,
        apiKey: crypto.randomBytes(16).toString('hex'),
      },
    });
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

  async deleteUserByApiKey(apiKey: string) {
    await this.prisma.user.delete({
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
        name: PUBLIC_USER_NAME,
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      where: {
        name: {
          not: PUBLIC_USER_NAME,
        },
      },
    });
  }
}
