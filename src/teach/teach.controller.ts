import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import {
  TeachDto,
  TeachSystemPromptDto,
  TeachSystemPromptResponseDto,
  Role,
  TeachResponseDto,
} from '@poly/common';
import { FunctionService } from 'function/function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';

@Controller('teach')
export class TeachController {
  private logger: Logger = new Logger(TeachController.name);

  public constructor(private readonly functionService: FunctionService) {}

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Post('/system-prompt')
  async teachSystemPrompt(@Req() req, @Body() body: TeachSystemPromptDto): Promise<TeachSystemPromptResponseDto> {
    await this.functionService.setSystemPrompt(req.user.id, body.prompt);
    return { response: 'Conversation cleared and new system prompt set!' };
  }

  @UseGuards(ApiKeyGuard)
  @Post('')
  async teach(
    @Req() req,
    @Body() teachDto: TeachDto,
  ): Promise<TeachResponseDto> {
    const {
      url,
      body,
      name = null,
      context = null,
      description = null,
      payload = null,
      response,
      variables = {},
      statusCode,
      templateHeaders,
      method,
      templateAuth,
      templateUrl,
      templateBody
    } = teachDto;
    this.logger.debug(`Teaching details of function for user ${req.user.id}...`);
    this.logger.debug(
      `name: ${name}, context: ${context}, description: ${description}, payload: ${payload}, response: ${response}, statusCode: ${statusCode}`,
    );
    return  this.functionService.teach(
      req.user,
      url,
      body,
      name,
      context,
      description,
      payload,
      response,
      variables,
      statusCode,
      templateHeaders,
      method,
      templateUrl,
      templateBody,
      templateAuth
    );
  }
}


