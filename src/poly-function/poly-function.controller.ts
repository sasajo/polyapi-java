import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { FunctionDto, ExecuteFunctionDto } from '@poly/common';

@Controller('function')
export class PolyFunctionController {
  constructor(private readonly service: PolyFunctionService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getAll(@Req() req): Promise<FunctionDto[]> {
    const polyFunctions = await this.service.getAllByUser(req.user);
    return polyFunctions.map(polyFunction => this.service.toDto(polyFunction));
  }

  @Post('/execute/:publicId')
  async executeFunction(@Param('publicId') publicId, @Body() executeFunctionDto: ExecuteFunctionDto): Promise<any> {
    return await this.service.executeFunction(publicId, executeFunctionDto);
  }
}
