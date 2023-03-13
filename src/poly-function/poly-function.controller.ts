import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { DeleteAllFunctionsDto, ExecuteFunctionDto, FunctionDto, Role, UpdateFunctionDto } from '@poly/common';
import { ParseIdPipe } from 'pipe/parse-id.pipe';

@Controller('functions')
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

  @Patch('/:publicId')
  @UseGuards(ApiKeyGuard)
  async updateFunction(@Req() req, @Param('publicId') publicId: string, @Body() {
    name = null,
    context = null,
    description = null,
    argumentTypes = null,
  }: UpdateFunctionDto): Promise<any> {
    return this.service.toDto(await this.service.updateFunction(req.user, publicId, name, context, description, argumentTypes));
  }

  @Delete('/all')
  @UseGuards(new ApiKeyGuard([Role.Admin]))
  async deleteAllFunctions(@Query() { userId, apiKey }: DeleteAllFunctionsDto): Promise<void> {
    if (!Number.isNaN(Number(userId))) {
      await this.service.deleteAllByUser(Number(userId));
    } else if (apiKey) {
      await this.service.deleteAllApiKey(apiKey);
    } else {
      throw new HttpException('Missing userId or apiKey parameter', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('/:id')
  @UseGuards(ApiKeyGuard)
  async deleteFunction(@Req() req, @Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.service.deleteFunction(req.user, id);
  }
}
