import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger, NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FunctionService } from 'function/function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import {
  CreateCustomFunctionDto,
  DeleteAllFunctionsDto,
  ExecuteApiFunctionDto,
  FunctionBasicDto,
  FunctionDefinitionDto,
  FunctionDetailsDto,
  GetAllFunctionsDto,
  Role,
  UpdateApiFunctionDto,
  ExecuteCustomFunctionDto, UpdateCustomFunctionDto,
} from '@poly/common';

export const HEADER_ACCEPT_FUNCTION_DEFINITION = 'application/poly.function-definition+json';

@Controller('functions')
export class FunctionController {
  private logger: Logger = new Logger(FunctionController.name);

  constructor(private readonly service: FunctionService) {
  }

  @Get('/api/:id')
  @UseGuards(ApiKeyGuard)
  async getApiFunction(@Req() req, @Param('id') id: string): Promise<FunctionDetailsDto> {
    const urlFunction = await this.service.findApiFunction(req.user, id);
    if (urlFunction) {
      return this.service.apiFunctionToDetailsDto(urlFunction);
    }

    throw new NotFoundException(`Function with ID ${id} not found.`);
  }

  @Patch('/api/:id')
  @UseGuards(ApiKeyGuard)
  async updateApiFunction(@Req() req, @Param('id') id: string, @Body() updateFunction: UpdateApiFunctionDto): Promise<any> {
    const {
      name = null,
      context = null,
      description = null,
      arguments: argumentsMetadata = null,
    } = updateFunction;
    const apiFunction = await this.service.findApiFunction(req.user, id);
    if (!apiFunction) {
      throw new NotFoundException('Function not found');
    }

    return this.service.apiFunctionToDetailsDto(
      await this.service.updateApiFunction(req.user, apiFunction, name, context, description, argumentsMetadata),
    );
  }

  @Post('/api/:id/execute')
  async executeApiFunction(@Param('id') id: string, @Body() executeFunctionDto: ExecuteApiFunctionDto): Promise<any> {
    const apiFunction = await this.service.findApiFunctionByPublicId(id);
    if (!apiFunction) {
      throw new NotFoundException(`Function with publicId ${id} not found.`);
    }

    return await this.service.executeUrlFunction(apiFunction, executeFunctionDto.args, executeFunctionDto.clientID);
  }

  @Get('/api/:id')
  @UseGuards(ApiKeyGuard)
  async getCustomFunction(@Req() req, @Param('id') id: string): Promise<FunctionDetailsDto> {
    const customFunction = await this.service.findCustomFunction(req.user, id);
    if (customFunction) {
      return this.service.customFunctionToDetailsDto(customFunction);
    }

    throw new NotFoundException(`Function with ID ${id} not found.`);
  }

  @Patch('/custom/:id')
  @UseGuards(ApiKeyGuard)
  async updateCustomFunction(@Req() req, @Param('id') id: string, @Body() updateFunction: UpdateCustomFunctionDto): Promise<any> {
    const {
      context = null,
      description = null,
    } = updateFunction;
    const customFunction = await this.service.findCustomFunction(req.user, id);
    if (!customFunction) {
      throw new NotFoundException('Function not found');
    }

    return this.service.customFunctionToDetailsDto(
      await this.service.updateCustomFunction(req.user, customFunction, context, description),
    );
  }

  @Post('/custom/:id/execute')
  async executeCustomFunction(@Param('id') id: string, @Body() executeFunctionDto: ExecuteCustomFunctionDto): Promise<any> {
    const customFunction = await this.service.findCustomFunctionByPublicId(id);
    if (!customFunction) {
      throw new NotFoundException(`Function with publicId ${id} not found.`);
    }
    if (!customFunction.serverSide) {
      throw new HttpException(`Function with publicId ${id} is not server function.`, HttpStatus.BAD_REQUEST);
    }

    return await this.service.executeServerFunction(customFunction, executeFunctionDto.args, executeFunctionDto.clientID);
  }

  @Delete('/')
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

  @Delete('/api/:publicId')
  @UseGuards(ApiKeyGuard)
  async deleteFunction(@Req() req, @Param('publicId') publicId: string): Promise<void> {
    await this.service.deleteApiFunction(req.user, publicId);
  }

  @Post('/custom')
  @UseGuards(ApiKeyGuard)
  async createCustomFunction(@Req() req, @Body() createCustomFunctionDto: CreateCustomFunctionDto): Promise<any> {
    // temporarily increase timeout for custom function creation
    req.setTimeout(300000);

    const { context = '', name, code, server = false } = createCustomFunctionDto;

    try {
      return await this.service.createCustomFunction(req.user, context, name, code, server);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
