import { Module } from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PolyFunctionService],
  exports: [PolyFunctionService]
})
export class PolyFunctionModule {
}
