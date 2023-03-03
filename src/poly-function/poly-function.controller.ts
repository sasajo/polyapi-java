import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ExecuteFunctionDto, FunctionDto, UpdateFunctionDto } from '@poly/common';
import { ParseIdPipe } from 'pipe/parse-id.pipe';

@Controller('function')
export class PolyFunctionController {
  private logger: Logger = new Logger(PolyFunctionController.name);

  constructor(private readonly service: PolyFunctionService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getAll(@Req() req): Promise<FunctionDto[]> {
    const polyFunctions = await this.service.getAllByUser(req.user);
    return polyFunctions.map(polyFunction => this.service.toDto(polyFunction));
  }

  @Post('/execute/:publicId')
  async executeFunction(@Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteFunctionDto): Promise<any> {
    return await this.service.executeFunction(publicId, executeFunctionDto);
  }

  @Put('/:id')
  @UseGuards(ApiKeyGuard)
  async updateFunction(@Req() req, @Param('id', ParseIdPipe) id: number, @Body() updateFunctionDto: UpdateFunctionDto): Promise<any> {
    return this.service.toDto(await this.service.updateFunction(req.user, id, updateFunctionDto.alias, updateFunctionDto.context));
  }

  @Delete('/:id')
  @UseGuards(ApiKeyGuard)
  async deleteFunction(@Req() req, @Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.service.deleteFunction(req.user, id);
  }
}
