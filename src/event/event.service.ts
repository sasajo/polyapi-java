import crypto from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ErrorEvent, VariableChangeEvent, VariableChangeEventType, Visibility } from '@poly/model';
import { AxiosError } from 'axios';
import { Environment, Variable } from '@prisma/client';
import { AuthService } from 'auth/auth.service';
import { AuthData } from 'common/types';
import { EMITTER } from './emitter/emitter.provider';
import { Emitter } from '@socket.io/redis-emitter';
import { SocketStorage, WebhookHandleListener, ErrorHandler } from './socket-storage/socket-storage.provider';

type Path = string;
@Injectable()
export class EventService {
  private logger: Logger = new Logger(EventService.name);

  constructor(
    private readonly authService: AuthService,
    @Inject(EMITTER) private readonly emitter: Emitter,
    private readonly socketStorage: SocketStorage,
  ) {
  }

  async registerErrorHandler(
    socket: Socket,
    authData: AuthData,
    path: string,
    applicationIds?: string[],
    environmentIds?: string[],
    functionIds?: string[],
    tenant?: boolean,
  ) {
    const id = crypto.randomUUID();
    this.logger.debug(`Registering error handler: ${socket.id} '${path}', applicationIds: ${applicationIds}, environmentIds: ${environmentIds}, functionIds: ${functionIds}, tenant: ${tenant} with ID=${id}}`);

    await this.socketStorage.pushErrorHandler({
      id,
      path,
      authData,
      applicationIds,
      environmentIds,
      functionIds,
      tenant,
      socketID: socket.id,
    });

    socket.join(socket.id);

    socket.on('disconnect', () => {
      this.logger.debug(`Client for error handler '${id}' disconnected. Removing handler...`);
      this.unregisterErrorHandler({
        id,
        path,
        authData,
        applicationIds,
        environmentIds,
        functionIds,
        tenant,
        socketID: socket.id,
      });
    });

    return id;
  }

  unregisterErrorHandler(errorHandler: ErrorHandler) {
    this.logger.debug(`Unregistering error handler: ${errorHandler.socketID} '${errorHandler.id}'`);

    this.socketStorage.removeErrorhandler(errorHandler);
  }

  async sendErrorEvent(
    id: string,
    environmentId: string,
    tenantId: string,
    visibility: Visibility,
    applicationId: string | null,
    userId: string | null,
    path: string,
    error: ErrorEvent,
  ): Promise<boolean> {
    const handlerEvent = {
      ...error,
      functionId: id,
      applicationId,
      userId,
    };

    const errorHandlers = await this.socketStorage.getErrorHandlers();

    const errorHandlersOnPath = errorHandlers
      .filter(this.filterByPath(path, handler => handler.path));
    const tenantHandlers = errorHandlersOnPath
      .filter(handler => handler.tenant === true && tenantId === handler.authData.tenant.id);
    const environmentHandlers = errorHandlersOnPath
      .filter(handler => handler.environmentIds?.includes(environmentId));
    const applicationHandlers = errorHandlersOnPath
      .filter(handler => applicationId && handler.applicationIds?.includes(applicationId));
    const functionHandlers = errorHandlersOnPath
      .filter(handler => handler.functionIds?.includes(id));
    const defaultHandlers = errorHandlersOnPath
      .filter(handler => handler.functionIds === undefined && handler.applicationIds === undefined && handler.environmentIds === undefined && handler.tenant === undefined)
      .filter(handler => !userId || handler.authData.user?.id === userId)
      .filter(handler => !applicationId || handler.authData.application?.id === applicationId);
    const allHandlers = [
      ...tenantHandlers,
      ...environmentHandlers,
      ...applicationHandlers,
      ...functionHandlers,
      ...defaultHandlers,
    ];

    if (!allHandlers.length) {
      return false;
    }

    const sentInfos = await Promise.all(allHandlers.map(async ({ id, authData, socketID }) => {
      // currently allowing Tenant access by default
      if (visibility !== Visibility.Public && authData.tenant.id !== tenantId) {
        return false;
      }

      this.logger.debug(`Sending error event for path: '${path}' to '${id}'`, handlerEvent);
      this.emitter.to(socketID).emit(`handleError:${id}`, handlerEvent);
      return true;
    }));

    // counted only if default handlers are used
    return defaultHandlers.length > 0 && sentInfos.some(sent => sent);
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

  async registerWebhookEventHandler(client: Socket, clientID: string, webhookHandleID: string, authData: AuthData) {
    this.logger.debug(`Registering webhook handler for webhook handle ${webhookHandleID} on ${clientID}`);

    client.join(client.id);

    const webhookHandleListener: WebhookHandleListener = {
      clientID,
      authData,
      webhookHandleID,
      socketID: client.id,
    };

    await this.socketStorage.pushWebhookHandleListener(webhookHandleListener);

    client.on('disconnect', () => {
      this.logger.debug(`Client for webhook event handler disconnected: ${clientID} '${webhookHandleID}'`);

      this.unregisterWebhookEventHandler(webhookHandleListener);
    });
  }

  unregisterWebhookEventHandler(webhookHandleListener: WebhookHandleListener) {
    this.logger.debug(`Unregistering webhook event handler: '${webhookHandleListener.webhookHandleID}' on ${webhookHandleListener.clientID}`);

    return this.socketStorage.removeWebhookHandleListener(webhookHandleListener);
  }

  async sendWebhookEvent(webhookHandleID: string, executionEnvironment: Environment | null, eventPayload: any, eventHeaders: Record<string, any>, subpathParams: Record<string, string>) {
    this.logger.debug(`Sending webhook event: '${webhookHandleID}'`, eventPayload);

    const webhookHandleListeners = await this.socketStorage.getWebhookHandleListeners();

    webhookHandleListeners.forEach(({ authData, webhookHandleID: id, socketID }) => {
      if ((executionEnvironment && authData.environment.id !== executionEnvironment.id) || id !== webhookHandleID) {
        return;
      }

      this.emitter.to(socketID).emit(`handleWebhookEvent:${webhookHandleID}`, {
        body: eventPayload,
        headers: eventHeaders,
        params: subpathParams,
      });
    });
  }

  async registerAuthFunctionEventHandler(client: Socket, clientID: string, authFunctionId: string): Promise<boolean> {
    this.logger.debug(`Registering handler for auth function ${authFunctionId} on ${clientID}`);

    const result = await this.socketStorage.pushAuthFunctionEventEventHandler({
      socketID: client.id,
      clientID,
      authFunctionId,
    });

    if (!result) {
      return false;
    }

    client.join(client.id);

    client.on('disconnect', () => {
      this.logger.debug(`Client for auth function handler disconnected: ${clientID} '${authFunctionId}'`);
      this.unregisterAuthFunctionEventHandler(client, clientID, authFunctionId);
    });

    return true;
  }

  unregisterAuthFunctionEventHandler(client: Socket, clientID: string, authFunctionId: string) {
    this.logger.debug(`Unregistering auth function handler: '${authFunctionId}' on ${clientID}`);

    this.socketStorage.removeAuthFunctionEventHandler({ clientID, authFunctionId, socketID: client.id });
  }

  async sendAuthFunctionEvent(authFunctionId: string, clientID: string | null, eventPayload: any) {
    this.logger.debug(`Sending auth function event: '${authFunctionId}'`, eventPayload);

    const handlers = await this.socketStorage.getAuthFunctionEventHandlers();

    for (const handler of handlers) {
      const matchAuthFunctionId = handler.authFunctionId === authFunctionId;

      if ((!clientID && matchAuthFunctionId) || (clientID && handler.clientID === clientID && matchAuthFunctionId)) {
        this.emitter.to(handler.socketID).emit(`handleAuthFunctionEvent:${authFunctionId}`, eventPayload);
      }
    }
  }

  async registerVariableChangeEventHandler(client: Socket, clientID: string, variableId: string): Promise<boolean> {
    this.logger.debug(`Registering handler for variable ${variableId} on ${clientID}`);

    const result = await this.socketStorage.pushVariableChangeHandler({
      clientID,
      variableId,
      socketID: client.id,
    });

    if (!result) {
      return false;
    }

    client.join(client.id);

    client.on('disconnect', () => {
      this.logger.debug(`Client for variable handler disconnected: ${clientID} '${variableId}'`);
      this.unregisterVariableChangeEventHandler(client, clientID, variableId);
    });

    return true;
  }

  unregisterVariableChangeEventHandler(client: Socket, clientID: string, variableId: string) {
    this.logger.debug(`Unregistering variable handler: '${variableId}' on ${clientID}`);

    this.socketStorage.removeVariableChangeHandler({
      clientID,
      variableId,
      socketID: client.id,
    });
  }

  async registerVariablesChangeEventHandler(
    client: Socket,
    clientID: string,
    authData: AuthData,
    path: string,
    type?: VariableChangeEventType,
    secret?: boolean,
  ): Promise<boolean> {
    this.logger.debug(`Registering handler for variables on path ${path} on ${clientID}`);

    const result = await this.socketStorage.pushVariablesChangeHandler({
      authData,
      clientID,
      path,
      secret,
      type,
      socketID: client.id,
    });

    if (!result) {
      return false;
    }

    client.join(client.id);

    client.on('disconnect', () => {
      this.logger.debug(`Client for variable handler disconnected: ${clientID} '${path}'`);
      this.unregisterVariablesChangeEventHandler(client, clientID, authData, path, type, secret);
    });

    return true;
  }

  async unregisterVariablesChangeEventHandler(client: Socket, clientID: string, authData: AuthData, path: string, type?: VariableChangeEventType,
    secret?: boolean,
  ) {
    this.logger.debug(`Unregistering variables handler: '${path}' on ${clientID}`);

    this.socketStorage.removeVariablesChangeHandler({
      clientID,
      path,
      authData,
      type,
      secret,
      socketID: client.id,
    });
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

    const [handlers, pathHandlers] = await Promise.all([this.socketStorage.getVariableChangeHandlers(), this.socketStorage.getVariablesChangeHandlers()]);

    handlers.forEach(handler => {
      if (handler.variableId === variable.id) {
        this.logger.debug(`Sending variable event: '${variable.id}'`, handlerEvent);
        this.emitter.to(handler.socketID).emit(`handleVariableChangeEvent:${variable.id}`, handlerEvent);
      }
    });

    const filteredPathHandlers = pathHandlers.filter(this.filterByPath(event.path, handler => handler.path)).filter(data => data.type == null || data.type === event.type)
      .filter(data => data.secret == null || data.secret === event.secret);

    for (const listener of filteredPathHandlers) {
      if (!await this.authService.hasEnvironmentEntityAccess(variable, listener.authData, true)) {
        return;
      }

      this.logger.debug(`Sending variable event for path: '${listener.path}'`, handlerEvent);

      this.emitter.to(listener.socketID).emit(`handleVariablesChangeEvent:${listener.path}`, handlerEvent);
    }
  }

  private filterByPath(path: string, mapToPath: (handler: any) => Path = handler => handler) {
    return handler => {
      const handlerPath = mapToPath(handler);
      return handlerPath === '' || path === handlerPath || path.startsWith(`${handlerPath}.`) || path.endsWith(`.${handlerPath}`);
    };
  }
}
