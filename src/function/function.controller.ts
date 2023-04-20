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
  ExecuteUrlFunctionDto,
  FunctionDefinitionDto,
  FunctionBasicDto,
  GetAllFunctionsDto,
  Role,
  UpdateFunctionDto,
  FunctionDetailsDto,
  CreateAuthFunctionDto,
  AuthFunctionDto,
  ExecuteAuthFunctionDto,
  ExecuteAuthFunctionResponseDto,
  ExecuteCustomFunctionDto,
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
  }: GetAllFunctionsDto): Promise<FunctionBasicDto[] | FunctionDefinitionDto[]> {
    this.logger.debug(`Getting all functions for user ${req.user.id} with contexts ${JSON.stringify(contexts)}, names ${JSON.stringify(names)}, ids ${JSON.stringify(ids)}`);

    const useDefinitionDto = acceptHeader === HEADER_ACCEPT_FUNCTION_DEFINITION;
    const urlFunctions = await this.service.getUrlFunctionsByUser(req.user, contexts, names, ids);
    const customFunctions = await this.service.getCustomFunctionsByUser(req.user, contexts, names, ids);
    const authFunctions = await this.service.getAuthFunctionsByUser(req.user, contexts, names, ids);

    if (useDefinitionDto) {
      return (await Promise.all(urlFunctions.map(urlFunction => this.service.urlFunctionToDefinitionDto(urlFunction))))
        .concat(...customFunctions.map(customFunction => this.service.customFunctionToDefinitionDto(customFunction)))
        .concat(...authFunctions.map(authFunction => this.service.authFunctionToDefinitionDto(authFunction)))
        ;
    } else {
      return urlFunctions.map(urlFunction => this.service.urlFunctionToBasicDto(urlFunction))
        .concat(...customFunctions.map(customFunction => this.service.customFunctionToBasicDto(customFunction)))
        .concat(...authFunctions.map(authFunction => this.service.authFunctionToBasicDto(authFunction)))
        ;
    }
  }

  @Get(':publicId')
  @UseGuards(ApiKeyGuard)
  async getFunction(@Req() req, @Param('publicId') publicId: string): Promise<FunctionDetailsDto> {
    const urlFunction = await this.service.findUrlFunction(req.user, publicId);
    if (urlFunction) {
      return this.service.urlFunctionToDetailsDto(urlFunction);
    }

    const customFunction = await this.service.findCustomFunction(req.user, publicId);
    if (customFunction) {
      return this.service.customFunctionToDetailsDto(customFunction);
    }

    throw new HttpException(`Function with ID ${publicId} not found.`, HttpStatus.NOT_FOUND);
  }

  @Post('/url/:publicId/execute')
  async executeUrlFunction(@Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteUrlFunctionDto): Promise<any> {
    const urlFunction = await this.service.findUrlFunctionByPublicId(publicId);
    if (!urlFunction) {
      throw new HttpException(`Function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }

    return await this.service.executeUrlFunction(urlFunction, executeFunctionDto.args, executeFunctionDto.clientID);
  }

  @Post('/custom/:publicId/execute')
  async executeCustomFunction(@Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteCustomFunctionDto): Promise<any> {
    const customFunction = await this.service.findCustomFunctionByPublicId(publicId);
    if (!customFunction) {
      throw new HttpException(`Function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }
    if (!customFunction.serverSide) {
      throw new HttpException(`Function with publicId ${publicId} is not server function.`, HttpStatus.BAD_REQUEST);
    }

    return await this.service.executeServerFunction(customFunction, executeFunctionDto.args, executeFunctionDto.clientID);
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
      return this.service.urlFunctionToDetailsDto(
        await this.service.updateUrlFunction(req.user, urlFunction, name, context, description, argumentsMetadata),
      );
    }

    const customFunction = await this.service.findCustomFunction(req.user, publicId);
    if (customFunction) {
      if (argumentsMetadata) {
        throw new HttpException('Arguments cannot be updated for a custom function.', HttpStatus.BAD_REQUEST);
      }
      if (name != null) {
        throw new HttpException('Name cannot be updated for a custom function.', HttpStatus.BAD_REQUEST);
      }
      return this.service.customFunctionToDetailsDto(
        await this.service.updateCustomFunction(req.user, customFunction, context, description),
      );
    }

    const authFunction = await this.service.findAuthFunction(req.user, publicId);
    if (authFunction) {
      if (argumentsMetadata) {
        throw new HttpException('Arguments cannot be updated for a auth function.', HttpStatus.BAD_REQUEST);
      }
      return this.service.authFunctionToBasicDto(
        await this.service.updateAuthFunction(req.user, authFunction, context, name, description),
      );
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
    // temporarily increase timeout for custom function creation
    req.setTimeout(300000);

    const { context = '', name, code, server = false } = createCustomFunctionDto;

    try {
      return await this.service.createCustomFunction(req.user, context, name, code, server);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/auth')
  @UseGuards(ApiKeyGuard)
  async createAuthFunction(@Req() req, @Body() createAuthFunctionDto: CreateAuthFunctionDto): Promise<AuthFunctionDto> {
    const { context = '', name, description = null, authUrl, accessTokenUrl } = createAuthFunctionDto;

    try {
      return this.service.authFunctionToDto(
        await this.service.createAuthFunction(req.user, context, name, description, authUrl, accessTokenUrl),
      );
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/auth/:publicId/execute')
  @UseGuards(ApiKeyGuard)
  async executeAuthFunction(@Req() req, @Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteAuthFunctionDto): Promise<ExecuteAuthFunctionResponseDto> {
    const authFunction = await this.service.findAuthFunctionByPublicId(publicId);
    if (!authFunction) {
      throw new HttpException(`Auth function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
    }

    const { eventsClientId, clientId, clientSecret, scopes } = executeFunctionDto;
    return await this.service.executeAuthFunction(req.user, authFunction, eventsClientId, clientId, clientSecret, scopes);
  }

  @Get('/auth/:publicId/callback')
  async authFunctionCallback(@Param('publicId') publicId: string, @Query() query: any): Promise<void> {
    this.logger.debug(`Auth function callback for ${publicId} with query ${JSON.stringify(query)}`);
    await this.service.processAuthFunctionCallback(publicId, query);
  }
}
