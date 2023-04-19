import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProviderController } from './auth-provider.controller';
import { AuthProviderService } from './auth-provider.service';
import { PrismaModule } from 'prisma/prisma.module';
import { EventModule } from 'event/event.module';

@Module({
  imports: [PrismaModule, EventModule, HttpModule],
  controllers: [AuthProviderController],
  providers: [AuthProviderService],
  exports: [AuthProviderService],
})
export class AuthProviderModule {}
