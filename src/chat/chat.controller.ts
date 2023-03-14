import { Req, Body, Controller, Logger, Post } from '@nestjs/common';
// import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { PostQuestionDto, PostQuestionResponseDto } from '@poly/common';
import { ChatService } from 'chat/chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly service: ChatService) {
  }

  @Post('/question')
  // @UseGuards(ApiKeyGuard)
  public async postQuestion(@Req() req, @Body() body: PostQuestionDto): Promise<PostQuestionResponseDto> {
    const hardcoded_user_id = 2;
    const responseTexts = await this.service.getMessageResponseTexts(hardcoded_user_id, body.message);
    this.logger.debug(responseTexts);
    return {
      texts: responseTexts,
    };
  }
}
