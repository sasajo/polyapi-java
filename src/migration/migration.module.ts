import { Module } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { PrismaModule } from 'prisma/prisma.module';
import { FunctionModule } from 'function/function.module';

@Module({
  imports: [PrismaModule, FunctionModule],
  providers: [MigrationService],
})
export class MigrationModule {}
