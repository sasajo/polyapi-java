import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { TeachDto, TeachResponseDto, TeachDetailsDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';

@Controller('teach')
export class TeachController {
  public constructor(private readonly polyFunctionService: PolyFunctionService) {
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  async teach(@Req() req, @Body() teachDto: TeachDto): Promise<TeachResponseDto> {
    const { url, method, alias, headers, body } = teachDto;
    const polyFunction = await this.polyFunctionService.findOrCreate(req.user, url, method, alias, headers, body);

    return {
      functionId: polyFunction.id,
    };
  }

  @UseGuards(ApiKeyGuard)
  @Post('/:functionId')
  async teachDetails(@Req() req, @Param('functionId') id: number, @Body() teachDetailsDto: TeachDetailsDto): Promise<void> {
    const { functionAlias = null, context = null, response } = teachDetailsDto;
    await this.polyFunctionService.updateDetails(id, req.user, functionAlias, context, response);
  }
}
