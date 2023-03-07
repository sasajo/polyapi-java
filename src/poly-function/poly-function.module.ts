import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { PrismaModule } from 'prisma/prisma.module';
import { PolyFunctionController } from './poly-function.controller';
import { EventModule } from 'event/event.module';

@Module({
  imports: [PrismaModule, HttpModule, EventModule],
  providers: [PolyFunctionService],
  exports: [PolyFunctionService],
  controllers: [PolyFunctionController]
})
export class PolyFunctionModule {
}
