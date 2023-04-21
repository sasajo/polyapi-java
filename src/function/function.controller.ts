import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FunctionService } from 'function/function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import {
  CreateCustomFunctionDto,
  DeleteAllFunctionsDto,
  ExecuteApiFunctionDto,
  ExecuteCustomFunctionDto,
  FunctionDetailsDto,
  Role,
  UpdateApiFunctionDto,
  UpdateCustomFunctionDto,
} from '@poly/common';

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

  @Delete('/api/:id')
  @UseGuards(ApiKeyGuard)
  async deleteApiFunction(@Req() req, @Param('id') id: string): Promise<any> {
    const apiFunction = await this.service.findApiFunction(req.user, id);
    if (!apiFunction) {
      throw new NotFoundException('Function not found');
    }

    await this.service.deleteApiFunction(req.user, id);
  }

  @Post('/api/:id/execute')
  async executeApiFunction(@Param('id') id: string, @Body() executeFunctionDto: ExecuteApiFunctionDto): Promise<any> {
    const apiFunction = await this.service.findApiFunctionByPublicId(id);
    if (!apiFunction) {
      throw new NotFoundException(`Function with publicId ${id} not found.`);
    }

    return await this.service.executeApiFunction(apiFunction, executeFunctionDto.args, executeFunctionDto.clientID);
  }

  @Post('/client')
  @UseGuards(ApiKeyGuard)
  async createClientFunction(@Req() req, @Body() createCustomFunctionDto: CreateCustomFunctionDto): Promise<any> {
    const { context = '', name, code} = createCustomFunctionDto;

    try {
      return await this.service.createCustomFunction(req.user, context, name, code, false);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('/client/:id')
  @UseGuards(ApiKeyGuard)
  async getClientFunction(@Req() req, @Param('id') id: string): Promise<FunctionDetailsDto> {
    const clientFunction = await this.service.findClientFunction(req.user, id);
    if (clientFunction) {
      return this.service.customFunctionToDetailsDto(clientFunction);
    }

    throw new NotFoundException(`Function with ID ${id} not found.`);
  }

  @Patch('/client/:id')
  @UseGuards(ApiKeyGuard)
  async updateClientFunction(@Req() req, @Param('id') id: string, @Body() updateFunction: UpdateCustomFunctionDto): Promise<any> {
    const {
      context = null,
      description = null,
    } = updateFunction;
    const clientFunction = await this.service.findClientFunction(req.user, id);
    if (!clientFunction) {
      throw new NotFoundException('Function not found');
    }

    return this.service.customFunctionToDetailsDto(
      await this.service.updateCustomFunction(req.user, clientFunction, context, description),
    );
  }

  @Delete('/client/:id')
  @UseGuards(ApiKeyGuard)
  async deleteClientFunction(@Req() req, @Param('id') id: string): Promise<any> {
    const clientFunction = await this.service.findClientFunction(req.user, id);
    if (!clientFunction) {
      throw new NotFoundException('Function not found');
    }

    await this.service.deleteCustomFunction(req.user, id);
  }

  @Post('/server')
  @UseGuards(ApiKeyGuard)
  async createServerFunction(@Req() req, @Body() createCustomFunctionDto: CreateCustomFunctionDto): Promise<any> {
    const { context = '', name, code} = createCustomFunctionDto;

    try {
      return await this.service.createCustomFunction(req.user, context, name, code, true);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('/server/:id')
  @UseGuards(ApiKeyGuard)
  async getServerFunction(@Req() req, @Param('id') id: string): Promise<FunctionDetailsDto> {
    const serverFunction = await this.service.findServerFunction(req.user, id);
    if (serverFunction) {
      return this.service.customFunctionToDetailsDto(serverFunction);
    }

    throw new NotFoundException(`Function with ID ${id} not found.`);
  }

  @Patch('/server/:id')
  @UseGuards(ApiKeyGuard)
  async updateServerFunction(@Req() req, @Param('id') id: string, @Body() updateFunction: UpdateCustomFunctionDto): Promise<any> {
    const {
      context = null,
      description = null,
    } = updateFunction;
    const serverFunction = await this.service.findServerFunction(req.user, id);
    if (!serverFunction) {
      throw new NotFoundException('Function not found');
    }

    return this.service.customFunctionToDetailsDto(
      await this.service.updateCustomFunction(req.user, serverFunction, context, description),
    );
  }

  @Delete('/server/:id')
  @UseGuards(ApiKeyGuard)
  async deleteServerFunction(@Req() req, @Param('id') id: string): Promise<any> {
    const serverFunction = await this.service.findServerFunction(req.user, id);
    if (!serverFunction) {
      throw new NotFoundException('Function not found');
    }

    await this.service.deleteCustomFunction(req.user, id);
  }

  @Post('/server/:id/execute')
  async executeCustomFunction(@Param('id') id: string, @Body() executeFunctionDto: ExecuteCustomFunctionDto): Promise<any> {
    const customFunction = await this.service.findCustomFunctionByPublicId(id);
    if (!customFunction) {
      throw new NotFoundException(`Function with publicId ${id} not found.`);
    }
    if (!customFunction.serverSide) {
      throw new BadRequestException(`Function with publicId ${id} is not server function.`);
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
      throw new BadRequestException('Missing userId or apiKey parameter');
    }
  }
}
