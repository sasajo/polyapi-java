import { Module } from '@nestjs/common';
import { FunctionModule } from 'function/function.module';
import { TeachController } from 'teach/teach.controller';

@Module({
  imports: [FunctionModule],
  controllers: [TeachController]
})
export class TeachModule {
}
