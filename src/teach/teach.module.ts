import { Module } from '@nestjs/common';
import { PolyFunctionModule } from 'poly-function/poly-function.module';
import { TeachController } from 'teach/teach.controller';

@Module({
  imports: [PolyFunctionModule],
  controllers: [TeachController]
})
export class TeachModule {
}
