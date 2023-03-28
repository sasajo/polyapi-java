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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FunctionService } from 'function/function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import {
  CreateCustomFunctionDto,
  DeleteAllFunctionsDto,
  ExecuteFunctionDto,
  FunctionDefinitionDto,
  FunctionDto, GetAllFunctionsDto,
  Role,
  UpdateFunctionDto,
} from '@poly/common';

export const HEADER_ACCEPT_FUNCTION_DEFINITION = 'application/poly.function-definition+json';

@Controller('functions')
export class FunctionController {
  private logger: Logger = new Logger(FunctionController.name);

  constructor(private readonly service: FunctionService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAll(@Req() req, @Headers('Accept') acceptHeader: string, @Query() {
    contexts,
    names,
    ids,
  }: GetAllFunctionsDto): Promise<FunctionDto[] | FunctionDefinitionDto[]> {
    this.logger.debug(`Getting all functions for user ${req.user.id} with contexts ${JSON.stringify(contexts)}, names ${JSON.stringify(names)}, ids ${JSON.stringify(ids)}`);

    const useDefinitionDto = acceptHeader === HEADER_ACCEPT_FUNCTION_DEFINITION;
    const urlFunctions = await this.service.getUrlFunctionsByUser(req.user, contexts, names, ids);
    const customFunctions = await this.service.getCustomFunctionsByUser(req.user, contexts, names, ids);

    if (useDefinitionDto) {
      return urlFunctions.map(urlFunction => this.service.urlFunctionToDefinitionDto(urlFunction))
        .concat(...customFunctions.map(customFunction => this.service.customFunctionToDefinitionDto(customFunction)));
    } else {
      return urlFunctions.map(urlFunction => this.service.urlFunctionToDto(urlFunction))
        .concat(...customFunctions.map(customFunction => this.service.customFunctionToDto(customFunction)));
    }
  }

  @Post('/execute/:publicId')
  async executeFunction(@Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteFunctionDto): Promise<any> {
    const urlFunction = await this.service.findUrlFunctionByPublicId(publicId);
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
    arguments: argumentsMetadata = null,
  }: UpdateFunctionDto): Promise<any> {
    const urlFunction = await this.service.findUrlFunction(req.user, publicId);
    if (urlFunction) {
      return this.service.urlFunctionToDto(await this.service.updateUrlFunction(req.user, urlFunction, name, context, description, argumentsMetadata));
    }

    const customFunction = await this.service.findCustomFunction(req.user, publicId);
    if (customFunction) {
      if (argumentsMetadata) {
        throw new HttpException('Arguments cannot be updated for a custom function.', HttpStatus.BAD_REQUEST);
      }
      if (name != null) {
        throw new HttpException('Name cannot be updated for a custom function.', HttpStatus.BAD_REQUEST);
      }
      return this.service.customFunctionToDto(await this.service.updateCustomFunction(req.user, customFunction, context, description));
    }

    throw new HttpException('Function not found', HttpStatus.NOT_FOUND);
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

  @Post('/custom')
  @UseGuards(ApiKeyGuard)
  async createCustomFunction(@Req() req, @Body() createCustomFunctionDto: CreateCustomFunctionDto): Promise<any> {
    try {
      return await this.service.createCustomFunction(req.user, createCustomFunctionDto.context, createCustomFunctionDto.name, createCustomFunctionDto.code);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
