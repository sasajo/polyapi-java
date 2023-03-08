import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ErrorHandlerDto, WebhookEventHandlerDto } from '@poly/common';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventService } from 'event/event.service';
import { UserService } from 'user/user.service';

@WebSocketGateway({ namespace: 'events' })
export class EventGateway {
  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger(EventGateway.name);

  constructor(private readonly eventService: EventService, private readonly userService: UserService) {
  }

  private async checkErrorHandler({ clientID, apiKey }: ErrorHandlerDto) {
    if (!clientID) {
      this.logger.debug(`Missing client ID.`);
      return false;
    }
    if (!apiKey) {
      this.logger.debug(`Missing API key.`);
      return false;
    }
    const user = await this.userService.findByApiKey(apiKey);
    if (!user) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }

  @SubscribeMessage('registerErrorHandler')
  async registerErrorHandler(client: Socket, errorHandler: ErrorHandlerDto) {
    if (!await this.checkErrorHandler(errorHandler)) {
      return false;
    }
    this.eventService.registerErrorHandler(client, errorHandler.clientID, errorHandler.path);
    return true;
  }

  @SubscribeMessage('unregisterErrorHandler')
  async unregisterErrorHandler(client: Socket, errorHandler: ErrorHandlerDto) {
    if (!await this.checkErrorHandler(errorHandler)) {
      return false;
    }
    this.eventService.unregisterErrorHandler(client, errorHandler.clientID, errorHandler.path);
  }

  private async checkWebhookEventHandler({ clientID, webhookHandleID, apiKey }: WebhookEventHandlerDto) {
    if (!clientID) {
      this.logger.debug(`Missing client ID.`);
      return false;
    }
    if (!webhookHandleID) {
      this.logger.debug(`Missing webhook handle ID.`);
      return false;
    }
    if (!apiKey) {
      this.logger.debug(`Missing API key.`);
      return false;
    }
    const user = await this.userService.findByApiKey(apiKey);
    if (!user) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }

  @SubscribeMessage('registerWebhookEventHandler')
  async registerWebhookEventHandler(client: Socket, webhookEventHandler: WebhookEventHandlerDto) {
    if (!await this.checkWebhookEventHandler(webhookEventHandler)) {
      return false;
    }
    this.eventService.registerWebhookEventHandler(client, webhookEventHandler.clientID, webhookEventHandler.webhookHandleID);
    return true;
  }

  @SubscribeMessage('unregisterWebhookEventHandler')
  async unregisterWebhookErrorHandler(client: Socket, webhookEventHandler: WebhookEventHandlerDto) {
    if (!await this.checkWebhookEventHandler(webhookEventHandler)) {
      return false;
    }
    this.eventService.unregisterWebhookEventHandler(client, webhookEventHandler.clientID, webhookEventHandler.webhookHandleID);
  }
}
