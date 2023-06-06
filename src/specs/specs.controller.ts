import { Controller, Get, Logger, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SpecsService } from 'specs/specs.service';
import { PolyKeyGuard } from 'auth/poly-key-auth-guard.service';
import { GetSpecsDto, Permission } from '@poly/common';
import { AuthRequest } from 'common/types';
import { AuthService } from 'auth/auth.service';

@Controller('specs')
export class SpecsController {
  private readonly logger = new Logger(SpecsController.name);

  constructor(private readonly service: SpecsService, private readonly authService: AuthService) {
  }

  @UseGuards(PolyKeyGuard)
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSpecifications(@Req() req: AuthRequest, @Query() { contexts, names, ids }: GetSpecsDto) {
    const environmentId = req.user.environment.id;

    await this.authService.checkPermissions(req.user, Permission.Use);

    this.logger.debug(`Getting all specs for environment ${environmentId} with contexts ${JSON.stringify(contexts)}, names ${JSON.stringify(names)}, ids ${JSON.stringify(ids)}`);

    return this.service.getSpecifications(environmentId, contexts, names, ids);
  }

  @Get('/versions')
  getVersion() {
    return {
      jsVersions: ['0.1.26-dev'],
    };
  }
}
