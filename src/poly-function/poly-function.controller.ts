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
  Headers,
} from '@nestjs/common';
import { PolyFunctionService } from 'poly-function/poly-function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import {
  DeleteAllFunctionsDto,
  ExecuteFunctionDto,
  FunctionDefinitionDto,
  FunctionDto,
  Role,
  UpdateFunctionDto,
} from '@poly/common';

export const HEADER_ACCEPT_FUNCTION_DEFINITION = 'application/poly.function-definition+json';

@Controller('functions')
export class PolyFunctionController {
  private logger: Logger = new Logger(PolyFunctionController.name);

  constructor(private readonly service: PolyFunctionService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getAll(@Req() req, @Headers('Accept') acceptHeader: string): Promise<FunctionDto[] | FunctionDefinitionDto[]> {
    const useDefinitionDto = acceptHeader === HEADER_ACCEPT_FUNCTION_DEFINITION;
    const polyFunctions = await this.service.getAllByUser(req.user);

    if (useDefinitionDto) {
      return polyFunctions.map(polyFunction => this.service.toDefinitionDto(polyFunction));
    } else {
      return polyFunctions.map(polyFunction => this.service.toDto(polyFunction));
    }
  }

  @Post('/execute/:publicId')
  async executeFunction(@Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteFunctionDto): Promise<any> {
    const urlFunction = await this.service.findByPublicId(publicId);
    if (!urlFunction) {
      throw new HttpException(`Function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }

    return await this.service.executeFunction(urlFunction, executeFunctionDto.args, executeFunctionDto.clientID);
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

  @Delete('/:publicId')
  @UseGuards(ApiKeyGuard)
  async deleteFunction(@Req() req, @Param('publicId') publicId: string): Promise<void> {
    await this.service.deleteFunction(req.user, publicId);
  }
}
