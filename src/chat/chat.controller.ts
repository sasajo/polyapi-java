import { Req, Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { SendQuestionDto, PostQuestionResponseDto, SendCommandDto } from '@poly/common';
import { ChatService } from 'chat/chat.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly service: ChatService) {
  }

  @Post('/question')
  @UseGuards(ApiKeyGuard)
  public async sendQuestion(@Req() req, @Body() body: SendQuestionDto): Promise<PostQuestionResponseDto> {
    const responseTexts = await this.service.getMessageResponseTexts(req.user.id, body.message);
    return {
      texts: responseTexts,
    };
  }

  @Post('/command')
  @UseGuards(ApiKeyGuard)
  public async sendCommand(@Req() req, @Body() body: SendCommandDto) {
    await this.service.processCommand(req.user.id, body.command);
  }
}
