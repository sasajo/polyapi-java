import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma, User, WebhookHandle } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { toPascalCase } from '@guanghechen/helper-string';
import { CommonService } from 'common/common.service';
import { PrismaService } from 'prisma/prisma.service';
import { EventService } from 'event/event.service';
import { UserService } from 'user/user.service';
import {
  PropertySpecification,
  SpecificationType,
  WebhookHandleDefinitionDto,
  WebhookHandleDto,
  WebhookHandleSpecification,
} from '@poly/common';
import { ConfigService } from 'config/config.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly eventService: EventService,
    private readonly userService: UserService,
  ) {
  }

  private create(data: Omit<Prisma.WebhookHandleCreateInput, 'createdAt'>): Promise<WebhookHandle> {
    return this.prisma.webhookHandle.create({
      data: {
        createdAt: new Date(),
        ...data,
      },
    });
  }

  public async getAllWebhookHandles(): Promise<WebhookHandle[]> {
    this.logger.debug(`Getting all webhook handles...`);

    return this.prisma.webhookHandle.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public async getWebhookHandles(user: User): Promise<WebhookHandle[]> {
    this.logger.debug(`Getting webhook handles for user ${user.name}...`);

    const publicUser = await this.userService.getPublicUser();

    return this.prisma.webhookHandle.findMany({
      where: {
        OR: [
          {
            userId: user.id,
          },
          {
            userId: publicUser.id,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public async registerWebhookContextFunction(user: User, context: string | null, name: string, eventPayload: any): Promise<WebhookHandle> {
    name = this.normalizeName(name);
    context = this.normalizeContext(context);

    this.logger.debug(`Registering webhook for ${context}/${name}...`);
    this.logger.debug(`Event payload: ${JSON.stringify(eventPayload)}`);

    const webhookHandle = await this.prisma.webhookHandle.findFirst({
      where: {
        name,
        context,
      },
    });

    if (webhookHandle) {
      if (webhookHandle.userId !== user.id) {
        throw new HttpException(`Webhook handle ${context}/${name} is already registered by another user.`, HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Webhook handle found for ${context}/${name} - updating...`);
      return this.prisma.webhookHandle.update({
        where: {
          id: webhookHandle.id,
        },
        data: {
          eventPayload: JSON.stringify(eventPayload),
        },
      });
    } else {
      this.logger.debug(`Creating new webhook handle for ${context}/${name}...`);
      return this.create({
        user: {
          connect: {
            id: user.id,
          },
        },
        name,
        context,
        eventPayload: JSON.stringify(eventPayload),
      });
    }
  }

  async triggerWebhookContextFunction(context: string, name: string, eventPayload: any) {
    this.logger.debug(`Triggering webhook for ${context}/${name}...`);
    const webhookHandle = await this.prisma.webhookHandle.findFirst({
      where: {
        name,
        context,
      },
    });

    if (!webhookHandle) {
      if (this.config.autoRegisterWebhookHandle) {
        this.logger.debug(`Webhook handle not found for ${context}/${name} - auto registering...`);
        await this.registerWebhookContextFunction(await this.userService.getPublicUser(), context, name, eventPayload);
        return;
      } else {
        this.logger.debug(`Webhook handle not found for ${context}/${name} - skipping...`);
        return;
      }
    }

    this.eventService.sendWebhookEvent(webhookHandle.id, eventPayload);
  }

  async triggerWebhookContextFunctionByID(id: string, eventPayload: any) {
    this.logger.debug(`Triggering webhook for ${id}...`);
    const webhookHandle = await this.prisma.webhookHandle.findFirst({
      where: {
        id,
      },
    });

    if (!webhookHandle) {
      this.logger.debug(`Webhook handle not found for ${id} - skipping...`);
      return;
    }

    this.eventService.sendWebhookEvent(webhookHandle.id, eventPayload);
  }

  toDto(webhookHandle: WebhookHandle): WebhookHandleDto {
    return {
      id: webhookHandle.id,
      name: webhookHandle.name,
      context: webhookHandle.context,
      urls: [
        `${this.config.hostUrl}/webhooks/${webhookHandle.id}`,
        webhookHandle.context
          ? `${this.config.hostUrl}/webhooks/${webhookHandle.context}/${webhookHandle.name}`
          : `${this.config.hostUrl}/webhooks/${webhookHandle.name}`,
      ],
    };
  }

  async toDefinitionDto(webhookHandle: WebhookHandle): Promise<WebhookHandleDefinitionDto> {
    const typeName = 'EventType';
    const namespace = toPascalCase(webhookHandle.name);
    const eventType = await this.commonService.generateTypeDeclaration(
      typeName,
      JSON.parse(webhookHandle.eventPayload),
      namespace,
    );

    return {
      id: webhookHandle.id,
      name: webhookHandle.name,
      context: webhookHandle.context,
      eventTypeName: `${namespace}.${typeName}`,
      eventType,
    };
  }

  async updateWebhookHandle(user: User, id: string, context: string | null, name: string | null) {
    const webhookHandle = await this.prisma.webhookHandle.findFirst({
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    if (!webhookHandle) {
      throw new HttpException(`Webhook handle ${id} not found.`, HttpStatus.NOT_FOUND);
    }
    if (name === '') {
      throw new HttpException(`Webhook handle name cannot be empty.`, HttpStatus.BAD_REQUEST);
    }

    name = this.normalizeName(name, webhookHandle);
    context = this.normalizeContext(context, webhookHandle);

    this.logger.debug(`Updating webhook for ${webhookHandle.context}/${webhookHandle.name} with context:${context}/name:${name}...`);

    return this.prisma.webhookHandle.update({
      where: {
        id: webhookHandle.id,
      },
      data: {
        context,
        name,
      },
    });
  }

  private normalizeName(name: string | null, webhookHandle?: WebhookHandle) {
    if (name == null) {
      name = webhookHandle?.name || '';
    }
    return name.replace(/[^a-zA-Z0-9.]/g, '');
  }

  private normalizeContext(context: string | null, webhookHandle?: WebhookHandle) {
    if (context == null) {
      context = webhookHandle?.context || '';
    }

    return context.replace(/[^a-zA-Z0-9.]/g, '');
  }

  async deleteWebhookHandle(user: User, id: string) {
    const webhookHandle = await this.prisma.webhookHandle.findFirst({
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    if (!webhookHandle) {
      throw new HttpException(`Webhook handle ${id} not found.`, HttpStatus.NOT_FOUND);
    }

    this.logger.debug(`Deleting webhook for ${webhookHandle.context}/${webhookHandle.name}...`);
    await this.prisma.webhookHandle.delete({
      where: {
        id: webhookHandle.id,
      },
    });
  }

  async toWebhookHandleSpecification(webhookHandle: WebhookHandle): Promise<WebhookHandleSpecification> {
    const getEventArgument = async (): Promise<PropertySpecification> => {
      const schema = await this.commonService.getJsonSchema('WebhookEventType', webhookHandle.eventPayload) || undefined;

      return {
        name: 'event',
        required: false,
        type: {
          kind: 'object',
          schema,
        },
      };
    };

    return {
      type: 'webhookHandle',
      id: webhookHandle.id,
      name: webhookHandle.name,
      context: webhookHandle.context,
      description: '',
      function: {
        arguments: [
          {
            name: 'callback',
            required: true,
            type: {
              kind: 'function',
              spec: {
                arguments: [await getEventArgument()],
                returnType: {
                  kind: 'void',
                },
              },
            },
          },
        ],
        returnType: {
          kind: 'function',
          name: 'UnregisterWebhookEventListener',
          spec: {
            arguments: [],
            returnType: {
              kind: 'void',
            },
          },
        },
      },
    };
  }
}
