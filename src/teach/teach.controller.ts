import { Body, Controller, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TeachDetailsDto, TeachDto, TeachResponseDto, TeachSystemPromptDto, TeachSystemPromptResponseDto, Role} from '@poly/common';
import { FunctionService } from 'function/function.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ParseIdPipe } from 'pipe/parse-id.pipe';

@Controller('teach')
export class TeachController {
  private logger: Logger = new Logger(TeachController.name);

  public constructor(private readonly polyFunctionService: FunctionService) {
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  async teach(@Req() req, @Body() teachDto: TeachDto): Promise<TeachResponseDto> {
    const { url, method, name, description, headers, body, auth } = teachDto;
    this.logger.debug(`Teaching ${method} ${url} with name '${name}' for user ${req.user.id}...`);
    const polyFunction = await this.polyFunctionService.findOrCreate(req.user, url, method, name, description, headers, body, auth);

    return {
      functionId: polyFunction.id,
    };
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Post('/system-prompt')
  async teachSystemPrompt(@Req() req, @Body() body: TeachSystemPromptDto): Promise<TeachSystemPromptResponseDto> {
    await this.polyFunctionService.setSystemPrompt(req.user.id, body.prompt);
    return {response: "Conversation cleared and new system prompt set!"}
  }

  @UseGuards(ApiKeyGuard)
  @Post('/:functionId')
  async teachDetails(@Req() req, @Param('functionId', ParseIdPipe) id: number, @Body() teachDetailsDto: TeachDetailsDto): Promise<void> {
    const { url, body, name = null, context = null, description = null, payload = null, response } = teachDetailsDto;
    this.logger.debug(`Teaching details of function ${id} for user ${req.user.id}...`);
    this.logger.debug(`name: ${name}, context: ${context}, description: ${description}, payload: ${payload}, response: ${response}`);
    await this.polyFunctionService.updateDetails(id, req.user, url, body, name, context, description, payload, response);
  }
}