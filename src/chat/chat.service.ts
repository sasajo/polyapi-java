import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ChatText } from '@poly/common';
import { catchError, lastValueFrom, map } from 'rxjs';
import { ConfigService } from 'config/config.service';
import { AiService } from 'ai/ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly aiService: AiService) {
  }

  public async getMessageResponseTexts(userId: number, message: string): Promise<ChatText[]> {
    const value = await this.aiService.getFunctionCompletion(userId, message);

    return [{
      type: 'markdown',
      value,
    }];
  }

  async processCommand(userId: string, command: string) {
    this.logger.debug(`Processing chat command: ${command}`);
    const [commandName] = command.split(' ');

    switch (commandName) {
      case 'clear':
        await this.aiService.clearConversation(userId);
        break;
    }
  }
}
