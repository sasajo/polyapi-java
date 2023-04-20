import { Controller, Get, Logger, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SpecsService } from 'specs/specs.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { GetSpecsDto } from '@poly/common';

@Controller('specs')
export class SpecsController {
  private readonly logger = new Logger(SpecsController.name);

  constructor(private readonly service: SpecsService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSpecifications(@Req() req, @Query() { contexts, names, ids }: GetSpecsDto) {
    this.logger.debug(`Getting all specs for user ${req.user.id} with contexts ${JSON.stringify(contexts)}, names ${JSON.stringify(names)}, ids ${JSON.stringify(ids)}`);
    return this.service.getSpecifications(req.user, contexts, names, ids);
  }

  @Get('/versions')
  getVersion() {
    return {
      jsVersions: ['0.1.26-dev'],
    };
  }
}
