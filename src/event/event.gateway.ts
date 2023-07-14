import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import {
  AuthFunctionEventHandlerDto,
  ErrorHandlerDto,
  VariableChangeEventHandlerDto,
  WebhookEventHandlerDto,
} from '@poly/model';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventService } from 'event/event.service';
import { AuthService } from 'auth/auth.service';

@WebSocketGateway({ namespace: 'events' })
export class EventGateway {
  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger(EventGateway.name);

  constructor(private readonly eventService: EventService, private readonly authService: AuthService) {
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

  @SubscribeMessage('registerWebhookEventHandler')
  async registerWebhookEventHandler(client: Socket, handler: WebhookEventHandlerDto) {
    if (!await this.checkWebhookEventHandler(handler)) {
      return false;
    }
    this.eventService.registerWebhookEventHandler(client, handler.clientID, handler.webhookHandleID);
    return true;
  }

  @SubscribeMessage('unregisterWebhookEventHandler')
  async unregisterWebhookEventHandler(client: Socket, handler: WebhookEventHandlerDto) {
    if (!await this.checkWebhookEventHandler(handler)) {
      return false;
    }
    this.eventService.unregisterWebhookEventHandler(client, handler.clientID, handler.webhookHandleID);
  }

  @SubscribeMessage('registerAuthFunctionEventHandler')
  async registerAuthFunctionEventHandler(client: Socket, handler: AuthFunctionEventHandlerDto) {
    if (!await this.checkAuthFunctionEventHandler(handler)) {
      return false;
    }
    return this.eventService.registerAuthFunctionEventHandler(client, handler.clientID, handler.functionId);
  }

  @SubscribeMessage('unregisterAuthFunctionEventHandler')
  async unregisterAuthFunctionEventHandler(client: Socket, webhookEventHandler: AuthFunctionEventHandlerDto) {
    if (!await this.checkAuthFunctionEventHandler(webhookEventHandler)) {
      return false;
    }
    this.eventService.unregisterAuthFunctionEventHandler(client, webhookEventHandler.clientID, webhookEventHandler.functionId);
  }

  @SubscribeMessage('registerVariableChangeEventHandler')
  async registerVariableChangeEventHandler(client: Socket, handler: VariableChangeEventHandlerDto) {
    if (!await this.checkVariableChangeEventHandler(handler)) {
      return false;
    }
    return this.eventService.registerVariableChangeEventHandler(client, handler.clientID, handler.variableId);
  }

  @SubscribeMessage('unregisterVariableChangeEventHandler')
  async unregisterVariableChangeEventHandler(client: Socket, handler: VariableChangeEventHandlerDto) {
    if (!await this.checkVariableChangeEventHandler(handler)) {
      return false;
    }
    this.eventService.unregisterVariableChangeEventHandler(client, handler.clientID, handler.variableId);
  }

  private async checkErrorHandler({ clientID, apiKey }: ErrorHandlerDto) {
    if (!clientID) {
      this.logger.debug('Missing client ID.');
      return false;
    }
    if (!apiKey) {
      this.logger.debug('Missing API key.');
      return false;
    }
    const authData = await this.authService.getAuthData(apiKey);
    if (!authData) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }

  private async checkWebhookEventHandler({ clientID, webhookHandleID, apiKey }: WebhookEventHandlerDto) {
    if (!clientID) {
      this.logger.debug('Missing client ID.');
      return false;
    }
    if (!webhookHandleID) {
      this.logger.debug('Missing webhook handle ID.');
      return false;
    }
    if (!apiKey) {
      this.logger.debug('Missing API key.');
      return false;
    }
    const authData = await this.authService.getAuthData(apiKey);
    if (!authData) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }

  private async checkAuthFunctionEventHandler({ clientID, functionId, apiKey }: AuthFunctionEventHandlerDto) {
    if (!clientID) {
      this.logger.debug('Missing client ID.');
      return false;
    }
    if (!functionId) {
      this.logger.debug('Missing function ID.');
      return false;
    }
    if (!apiKey) {
      this.logger.debug('Missing API key.');
      return false;
    }
    const authData = await this.authService.getAuthData(apiKey);
    if (!authData) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }

  private async checkVariableChangeEventHandler({ clientID, variableId, apiKey }: VariableChangeEventHandlerDto) {
    if (!clientID) {
      this.logger.debug('Missing client ID.');
      return false;
    }
    if (!variableId) {
      this.logger.debug('Missing variable ID.');
      return false;
    }
    if (!apiKey) {
      this.logger.debug('Missing API key.');
      return false;
    }
    const authData = await this.authService.getAuthData(apiKey);
    if (!authData) {
      this.logger.debug(`Invalid API key: ${apiKey}`);
      return false;
    }
    return true;
  }
}
