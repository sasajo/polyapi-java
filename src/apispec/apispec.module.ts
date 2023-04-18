import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiSpecService } from 'apispec/apispec.service';
import { ApiSpecController } from 'apispec/apispec.controller';

@Module({
  imports: [HttpModule],
  providers: [ApiSpecService],
  controllers: [ApiSpecController]
})
export class ApiSpecModule {}
