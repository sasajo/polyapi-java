import { Injectable, Logger } from '@nestjs/common';
import { ChatText } from '@poly/common';
import { PrismaService } from 'prisma/prisma.service';
import { AiService } from 'ai/ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly aiService: AiService, private readonly prisma: PrismaService) {}

  public async getMessageResponseTexts(environmentId: string, userId: string, message: string): Promise<ChatText[]> {
    const { answer, stats } = await this.aiService.getFunctionCompletion(environmentId, userId, message);

    return [
      {
        type: 'markdown',
        value: answer,
        stats,
      },
    ];
  }

  async processCommand(environmentId: string, userId: string, command: string) {
    this.logger.debug(`Processing chat command: ${command}`);
    const [commandName] = command.split(' ');

    switch (commandName) {
      case 'clear':
        await this.aiService.clearConversation(environmentId, userId);
        break;
    }
  }

  async getConversationIds(userId: string): Promise<string[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return conversations.map((c) => c.id);
  }

  async getConversationDetail(userId: string, conversationId: string): Promise<string> {
    let conversation;
    let where;
    if (conversationId === 'last') {
      where = { where: { userId }, orderBy: { createdAt: 'desc' } };
    } else {
      where = { where: { userId, id: conversationId } };
    }
    try {
      conversation = await this.prisma.conversation.findFirstOrThrow(where);
    } catch {
      return new Promise((resolve) => resolve('Conversation not found.'));
    }

    console.log(conversation);
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    console.log(messages);
    const parts = messages.map((m) => `${m.role.toUpperCase()}\n\n${m.content}`);
    return parts.join('\n\n');
  }
}
