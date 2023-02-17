import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
  }

  public async findByApiKey(apiKey: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        apiKey,
      },
    });
  }
}
