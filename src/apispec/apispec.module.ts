import { Module } from '@nestjs/common';
// import { ApiSpecService } from 'apispec/apispec.service';
import { ApiSpecController } from 'apispec/apispec.controller';

@Module({
  imports: [],
  // providers: [ApiSpecService],
  controllers: [ApiSpecController]
})
export class ApiSpecModule {}
