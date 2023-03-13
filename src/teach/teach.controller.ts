import { Body, Controller, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { TeachDetailsDto, TeachDto, TeachResponseDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ParseIdPipe } from 'pipe/parse-id.pipe';

@Controller('teach')
export class TeachController {
  private logger: Logger = new Logger(TeachController.name);

  public constructor(private readonly polyFunctionService: PolyFunctionService) {
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  async teach(@Req() req, @Body() teachDto: TeachDto): Promise<TeachResponseDto> {
    const { url, method, name, headers, body } = teachDto;
    this.logger.debug(`Teaching ${method} ${url} with name '${name}' for user ${req.user.id}...`);
    const polyFunction = await this.polyFunctionService.findOrCreate(req.user, url, method, name, headers, body);

    return {
      functionId: polyFunction.id,
    };
  }

  @UseGuards(ApiKeyGuard)
  @Post('/:functionId')
  async teachDetails(@Req() req, @Param('functionId', ParseIdPipe) id: number, @Body() teachDetailsDto: TeachDetailsDto): Promise<void> {
    const { name = null, context = null, description = null, payload = null, response } = teachDetailsDto;
    this.logger.debug(`Teaching details of function ${id} for user ${req.user.id}...`);
    this.logger.debug(`name: ${name}, context: ${context}, description: ${description}, payload: ${payload}, response: ${response}`);
    await this.polyFunctionService.updateDetails(id, req.user, name, context, description, payload, response);
  }
}
