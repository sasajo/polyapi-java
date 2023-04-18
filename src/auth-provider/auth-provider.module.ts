import { Module } from '@nestjs/common';
import { AuthProviderController } from './auth-provider.controller';
import { AuthProviderService } from './auth-provider.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthProviderController],
  providers: [AuthProviderService],
  exports: [AuthProviderService],
})
export class AuthProviderModule {}
