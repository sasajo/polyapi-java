import { Body, Controller, Logger, Post } from '@nestjs/common';
import { PostQuestionDto, PostQuestionResponseDto } from '@poly/common';
import { ChatService } from 'chat/chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly service: ChatService) {
  }

  @Post('/question')
  public async postQuestion(@Body() body: PostQuestionDto): Promise<PostQuestionResponseDto> {
    const responseTexts = await this.service.getMessageResponseTexts(body.message);
    // NOTE: the results are going to be absolute TRASH for a while
    this.logger.debug(responseTexts);
    return {
      texts: responseTexts,
    };
  }
}
