import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SpecsService } from 'specs/specs.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';

@Controller('specs')
export class SpecsController {
  constructor(private readonly service: SpecsService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getSpecifications(@Req() req) {
    return this.service.getSpecifications(req.user);
  }

  @Get('/versions')
  getVersion() {
    return {
      jsVersions: ['0.1.26-dev'],
    };
  }
}
