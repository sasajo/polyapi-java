import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ErrorEvent, VariableChangeEvent, VariableChangeEventType } from '@poly/model';
import { AxiosError } from 'axios';
import { Variable } from '@prisma/client';
import { AuthService } from 'auth/auth.service';
import { AuthData } from 'common/types';

type ClientID = string;
type Path = string;
type WebhookHandleID = string;
type AuthFunctionID = string;
type VariableID = string;
type VariableSocketListener = {
  socket: Socket;
  authData: AuthData;
  type?: VariableChangeEventType;
  secret?: boolean;
}

@Injectable()
export class EventService {
  private logger: Logger = new Logger(EventService.name);
  private readonly errorHandlers: Record<ClientID, Record<Path, Socket[]>> = {};
  private readonly webhookEventHandlers: Record<ClientID, Record<WebhookHandleID, Socket[]>> = {};
  private readonly authFunctionHandlers: Record<ClientID, Record<AuthFunctionID, Socket[]>> = {};
  private readonly variableChangeHandlers: Record<ClientID, Record<VariableID, Socket[]>> = {};
  private readonly variablesChangeHandlers: Record<ClientID, Record<Path, VariableSocketListener[]>> = {};

  constructor(
    private readonly authService: AuthService,
  ) {
  }

  registerErrorHandler(client: Socket, clientID: string, path: string) {
    this.logger.debug(`Registering error handler: ${clientID} '${path}'`);
    if (!this.errorHandlers[clientID]) {
      this.errorHandlers[clientID] = {};
    }
    if (!this.errorHandlers[clientID][path]) {
      this.errorHandlers[clientID][path] = [];
    }
    this.errorHandlers[clientID][path].push(client);

    client.on('disconnect', () => {
      this.logger.debug(`Client for error handler disconnected: ${clientID} '${path}'`);
      this.unregisterErrorHandler(client, clientID, path);
    });
  }

  unregisterErrorHandler(client: Socket, clientID: string, path: string) {
    this.logger.debug(`Unregistering error handler: ${clientID} '${path}'`);
    if (!this.errorHandlers[clientID]?.[path]) {
      return;
    }
    this.errorHandlers[clientID][path] = this.errorHandlers[clientID][path].filter(socket => socket.id !== client.id);
  }

  sendErrorEvent(clientID: string | null, functionPath: string, error: ErrorEvent): boolean {
    if (!clientID) {
      return false;
    }

    const clientErrorHandler = this.errorHandlers[clientID];
    if (!clientErrorHandler) {
      return false;
    }
    const handlers = Object.keys(clientErrorHandler)
      .filter(this.filterByPath(functionPath));

    handlers
      .forEach(handlerPath => {
        this.logger.debug(`Sending error event: ${clientID} '${functionPath}'->'${handlerPath}'`, error);
        clientErrorHandler[handlerPath].forEach(socket => socket.emit(`handleError:${handlerPath}`, error));
      });

    return handlers.length > 0;
  }

  getEventError(error: AxiosError): ErrorEvent {
    if (error.response) {
      return {
        message: error.message,
        data: error.response.data,
        status: error.response.status,
        statusText: error.response.statusText,
      };
    } else {
      return {
        message: error.message,
      };
    }
  }

  registerWebhookEventHandler(client: Socket, clientID: string, webhookHandleID: string) {
    this.logger.debug(`Registering webhook handler for webhook handle ${webhookHandleID} on ${clientID}`);
    if (!this.webhookEventHandlers[clientID]) {
      this.webhookEventHandlers[clientID] = {};
    }
    if (!this.webhookEventHandlers[clientID][webhookHandleID]) {
      this.webhookEventHandlers[clientID][webhookHandleID] = [];
    }
    this.webhookEventHandlers[clientID][webhookHandleID].push(client);

    client.on('disconnect', () => {
      this.logger.debug(`Client for webhook event handler disconnected: ${clientID} '${webhookHandleID}'`);
      this.unregisterWebhookEventHandler(client, clientID, webhookHandleID);
    });
  }

  unregisterWebhookEventHandler(client: Socket, clientID: string, webhookHandleID: string) {
    this.logger.debug(`Unregistering webhook event handler: '${webhookHandleID}' on ${clientID}`);
    if (!this.webhookEventHandlers[clientID]?.[webhookHandleID]) {
      return;
    }

    this.webhookEventHandlers[clientID][webhookHandleID] = this.webhookEventHandlers[clientID][webhookHandleID]
      .filter(socket => socket.id !== client.id);
  }

  sendWebhookEvent(webhookHandleID: string, eventPayload: any) {
    this.logger.debug(`Sending webhook event: '${webhookHandleID}'`, eventPayload);

    Object.values(this.webhookEventHandlers).forEach(clientHandlers => {
      if (!clientHandlers[webhookHandleID]) {
        return;
      }
      clientHandlers[webhookHandleID].forEach(socket => socket.emit(`handleWebhookEvent:${webhookHandleID}`, eventPayload));
    });
  }

  registerAuthFunctionEventHandler(client: Socket, clientID: string, authFunctionId: string): boolean {
    this.logger.debug(`Registering handler for auth function ${authFunctionId} on ${clientID}`);
    if (!this.authFunctionHandlers[clientID]) {
      this.authFunctionHandlers[clientID] = {};
    }
    let handlers = this.authFunctionHandlers[clientID][authFunctionId];
    if (!handlers) {
      this.authFunctionHandlers[clientID][authFunctionId] = handlers = [];
    }
    if (handlers.some(socket => socket.id === client.id)) {
      return false;
    }
    handlers.push(client);

    client.on('disconnect', () => {
      this.logger.debug(`Client for auth function handler disconnected: ${clientID} '${authFunctionId}'`);
      this.unregisterAuthFunctionEventHandler(client, clientID, authFunctionId);
    });

    return true;
  }

  unregisterAuthFunctionEventHandler(client: Socket, clientID: string, authFunctionId: string) {
    this.logger.debug(`Unregistering auth function handler: '${authFunctionId}' on ${clientID}`);
    if (!this.authFunctionHandlers[clientID]?.[authFunctionId]) {
      return;
    }

    this.authFunctionHandlers[clientID][authFunctionId] = this.authFunctionHandlers[clientID][authFunctionId]
      .filter(socket => socket.id !== client.id);
  }

  sendAuthFunctionEvent(authFunctionId: string, clientID: string | null, eventPayload: any) {
    this.logger.debug(`Sending auth function event: '${authFunctionId}'`, eventPayload);

    const handlers = clientID ? [this.authFunctionHandlers[clientID]] : Object.values(this.authFunctionHandlers);
    handlers.forEach(clientHandlers => {
      if (!clientHandlers?.[authFunctionId]) {
        return;
      }
      clientHandlers[authFunctionId].forEach(socket => {
        this.logger.debug(`Sending auth function event: '${authFunctionId}'`, eventPayload);
        socket.emit(`handleAuthFunctionEvent:${authFunctionId}`, eventPayload);
      });
    });
  }

  registerVariableChangeEventHandler(client: Socket, clientID: string, variableId: string): boolean {
    this.logger.debug(`Registering handler for variable ${variableId} on ${clientID}`);
    if (!this.variableChangeHandlers[clientID]) {
      this.variableChangeHandlers[clientID] = {};
    }
    let handlers = this.variableChangeHandlers[clientID][variableId];
    if (!handlers) {
      this.variableChangeHandlers[clientID][variableId] = handlers = [];
    }
    if (handlers.some(socket => socket.id === client.id)) {
      return false;
    }
    handlers.push(client);

    client.on('disconnect', () => {
      this.logger.debug(`Client for variable handler disconnected: ${clientID} '${variableId}'`);
      this.unregisterVariableChangeEventHandler(client, clientID, variableId);
    });

    return true;
  }

  unregisterVariableChangeEventHandler(client: Socket, clientID: string, variableId: string) {
    this.logger.debug(`Unregistering variable handler: '${variableId}' on ${clientID}`);
    if (!this.variableChangeHandlers[clientID]?.[variableId]) {
      return;
    }

    this.variableChangeHandlers[clientID][variableId] = this.variableChangeHandlers[clientID][variableId]
      .filter(socket => socket.id !== client.id);
  }

  registerVariablesChangeEventHandler(
    client: Socket,
    clientID: string,
    authData: AuthData,
    path: string,
    type?: VariableChangeEventType,
    secret?: boolean,
  ): boolean {
    this.logger.debug(`Registering handler for variables on path ${path} on ${clientID}`);
    if (!this.variablesChangeHandlers[clientID]) {
      this.variablesChangeHandlers[clientID] = {};
    }
    let handlers = this.variablesChangeHandlers[clientID][path];
    if (!handlers) {
      this.variablesChangeHandlers[clientID][path] = handlers = [];
    }
    if (handlers.some(filterSocket => filterSocket.socket.id === client.id)) {
      return false;
    }
    handlers.push({
      socket: client,
      authData,
      type,
      secret,
    });

    client.on('disconnect', () => {
      this.logger.debug(`Client for variable handler disconnected: ${clientID} '${path}'`);
      this.unregisterVariablesChangeEventHandler(client, clientID, path);
    });

    return true;
  }

  unregisterVariablesChangeEventHandler(client: Socket, clientID: string, path: string) {
    this.logger.debug(`Unregistering variable handler: '${path}' on ${clientID}`);
    if (!this.variableChangeHandlers[clientID]?.[path]) {
      return;
    }

    this.variableChangeHandlers[clientID][path] = this.variableChangeHandlers[clientID][path]
      .filter(socket => socket.id !== client.id);
  }

  async sendVariableChangeEvent(variable: Variable, event: VariableChangeEvent) {
    this.logger.debug(`Sending variable update event: '${variable.id}'=${event.currentValue}`);

    const handlerEvent = {
      id: variable.id,
      type: event.type,
      secret: event.secret,
      previousValue: event.previousValue,
      currentValue: event.currentValue,
      updateTime: event.updateTime,
      updatedBy: event.updatedBy,
      updatedFields: event.updatedFields,
    };

    const handlers = Object.values(this.variableChangeHandlers);
    handlers.forEach(clientHandlers => {
      if (!clientHandlers?.[variable.id]) {
        return;
      }
      clientHandlers[variable.id].forEach(socket => {
        this.logger.debug(`Sending variable event: '${variable.id}'`, handlerEvent);
        socket.emit(`handleVariableChangeEvent:${variable.id}`, handlerEvent);
      });
    });

    const pathHandlers = Object.values(this.variablesChangeHandlers);
    for (const pathHandler of pathHandlers) {
      const paths = Object.keys(pathHandler)
        .filter(this.filterByPath(event.path));

      for (const path of paths) {
        const listeners = pathHandler[path]
          .filter(data => data.type === undefined || data.type === event.type)
          .filter(data => data.secret === undefined || data.secret === event.secret);

        await Promise.all(listeners.map(async ({ authData, socket }) => {
          if (!await this.authService.hasEnvironmentEntityAccess(variable, authData, true)) {
            return;
          }

          this.logger.debug(`Sending variable event for path: '${path}'`, handlerEvent);
          socket.emit(`handleVariablesChangeEvent:${path}`, handlerEvent);
        }));
      }
    }
  }

  private filterByPath(path: string) {
    return handlerPath => handlerPath === '' || path === handlerPath || path.startsWith(`${handlerPath}.`) || path.endsWith(`.${handlerPath}`);
  }
}
