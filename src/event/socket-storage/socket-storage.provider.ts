import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { AuthData } from 'common/types';
import { VariableChangeEventType } from '@poly/model';

import { exec } from 'child_process';
import { promisify } from 'util';
import Redlock from 'redlock';
import { REDLOCK } from 'common/providers/redlock.provider';

const promisifiedExec = promisify(exec);

export type ErrorHandler = {
    id: string;
    path: string;
    authData: AuthData;
    applicationIds?: string[];
    environmentIds?: string[];
    functionIds?: string[];
    tenant?: boolean;
    socketID: string;
  }
export type WebhookHandleListener = {
    clientID: string;
    authData: AuthData;
    webhookHandleID: string;
    socketID: string;
}

export type VariableChangeHandler = {
    clientID: string;
    variableId: string;
    socketID: string;
  }

export type VariablesChangeHandler = {
    clientID: string;
    path: string;
    authData: AuthData;
    type?: VariableChangeEventType;
    secret?: boolean;
    socketID: string;
  }

export type AuthFunctionEventHandler = {
    clientID: string;
    authFunctionId: string;
    socketID: string;
  }

@Injectable()
export class SocketStorage implements OnModuleInit, OnModuleDestroy {
  private logger: Logger = new Logger('SocketStorage');

  private serverId: string = crypto.randomUUID();

  constructor(@Inject(REDLOCK) private readonly redlock: Redlock) {
    this.redisClient.on('error', error => {
      this.logger.error('SocketStorage - Redis error: ', error);
    });
  }

  async onModuleInit() {
    const result = await promisifiedExec('echo $HOSTNAME');

    if (result.stdout) {
      this.serverId = result.stdout;
    }
  }

  onModuleDestroy() {
    return this.cleanSocketListeners();
  }

  getServerId() {
    return this.serverId;
  }

  async getWebhookHandleListeners(): Promise<(WebhookHandleListener & { serverId: string })[]> {
    const webhookHandleListeners = await this.redisClient.lrange(this.getHandleKey('webhookHandleListeners'), 0, -1);

    return webhookHandleListeners.map(value => JSON.parse(value) as WebhookHandleListener & { serverId: string });
  }

  async pushWebhookHandleListener(webhookHandleListener: WebhookHandleListener) {
    return !!(await this.redisClient.lpush(this.getHandleKey('webhookHandleListeners'), JSON.stringify({
      webhookHandleID: webhookHandleListener.webhookHandleID,
      authData: webhookHandleListener.authData,
      clientID: webhookHandleListener.clientID,
      socketID: webhookHandleListener.socketID,
      serverId: this.serverId,
    } as WebhookHandleListener & { serverId: string })));
  }

  async removeWebhookHandleListener(webhookHandleListener: WebhookHandleListener) {
    try {
      return !!(await this.redisClient.lrem(this.getHandleKey('webhookHandleListeners'), 1, JSON.stringify({
        webhookHandleID: webhookHandleListener.webhookHandleID,
        authData: webhookHandleListener.authData,
        clientID: webhookHandleListener.clientID,
        socketID: webhookHandleListener.socketID,
        serverId: this.serverId,
      } as WebhookHandleListener & { serverId: string })));
    } catch (err) {
      this.logger.error('Failed to remove webhook handle listener from redis.', webhookHandleListener, err);
      return false;
    }
  }

  async getErrorHandlers(): Promise<(ErrorHandler & { serverId: string })[]> {
    const errorHandlers = await this.redisClient.lrange(this.getHandleKey('errorHandlers'), 0, -1);

    return errorHandlers.map(value => JSON.parse(value) as ErrorHandler & { serverId: string });
  }

  async pushErrorHandler(errorHandler: ErrorHandler) {
    return !!(await this.redisClient.lpush(this.getHandleKey('errorHandlers'), JSON.stringify({
      authData: errorHandler.authData,
      id: errorHandler.id,
      path: errorHandler.path,
      applicationIds: errorHandler.applicationIds,
      environmentIds: errorHandler.environmentIds,
      functionIds: errorHandler.functionIds,
      tenant: errorHandler.tenant,
      socketID: errorHandler.socketID,
      serverId: this.serverId,
    } as ErrorHandler & { serverId: string })));
  }

  async removeErrorhandler(errorHandler: ErrorHandler) {
    try {
      return !!(await this.redisClient.lrem(this.getHandleKey('errorHandlers'), 1, JSON.stringify({
        authData: errorHandler.authData,
        id: errorHandler.id,
        path: errorHandler.path,
        applicationIds: errorHandler.applicationIds,
        environmentIds: errorHandler.environmentIds,
        functionIds: errorHandler.functionIds,
        tenant: errorHandler.tenant,
        socketID: errorHandler.socketID,
        serverId: this.serverId,
      } as ErrorHandler & { serverId: string })));
    } catch (err) {
      this.logger.error('Failed to remove error handler from redis', errorHandler, err);
      return false;
    }
  }

  async getVariableChangeHandlers(): Promise<(VariableChangeHandler & { serverId: string })[]> {
    const variableChangeHandlers = await this.redisClient.lrange(this.getHandleKey('variableChangeHandlers'), 0, -1);

    return variableChangeHandlers.map(value => JSON.parse(value) as VariableChangeHandler & { serverId: string });
  }

  async pushVariableChangeHandler(variableChangeHandler: VariableChangeHandler) {
    const lock = await this.redlock.acquire([this.getHandleKey('variableChangeHandlers', 'lock')], 5000);

    try {
      const foundSocket = await this.findVariableChangeHandlerBySocket(variableChangeHandler.socketID, variableChangeHandler.variableId);

      if (foundSocket) {
        return false;
      }
      // We need to respect same key order to be able to remove it successfully from redis.
      const result = await this.redisClient.lpush(this.getHandleKey('variableChangeHandlers'), JSON.stringify({
        clientID: variableChangeHandler.clientID,
        variableId: variableChangeHandler.variableId,
        socketID: variableChangeHandler.socketID,
        serverId: this.serverId,
      } as VariableChangeHandler & { serverId: string }));

      return !!result;
    } catch (err) {
      this.logger.error('Error in `pushVariableChangeHandler`.', err);
    } finally {
      lock.release().catch(error => this.logger.error('Error trying to release lock in `pushVariableChangeHandler`', error));
    }

    return false;
  }

  async removeVariableChangeHandler(variableChangeHandler: VariableChangeHandler) {
    try {
      // We need to respect same key order to be able to remove it successfully from redis.
      return !!(await this.redisClient.lrem(this.getHandleKey('variableChangeHandlers'), 1, JSON.stringify({
        clientID: variableChangeHandler.clientID,
        variableId: variableChangeHandler.variableId,
        socketID: variableChangeHandler.socketID,
        serverId: this.serverId,
      } as VariableChangeHandler & { serverId: string })));
    } catch (err) {
      this.logger.error('Failed to remove variable change handler from redis', variableChangeHandler, err);
      return false;
    }
  }

  async getVariablesChangeHandlers(): Promise<(VariablesChangeHandler & { serverId: string })[]> {
    const variablesChangeHandlers = await this.redisClient.lrange(this.getHandleKey('variablesChangeHandlers'), 0, -1);

    return variablesChangeHandlers.map(value => JSON.parse(value) as VariablesChangeHandler & { serverId: string });
  }

  async pushVariablesChangeHandler(variablesChangeHandler: VariablesChangeHandler) {
    const lock = await this.redlock.acquire([this.getHandleKey('variablesChangeHandlers', 'lock')], 5000);

    try {
      const foundSocket = await this.findVariablesChangeHandlerBySocket(variablesChangeHandler.socketID, variablesChangeHandler.path);

      if (foundSocket) {
        return false;
      }

      // We need to respect same key order to be able to remove it successfully from redis.
      const result = await this.redisClient.lpush(this.getHandleKey('variablesChangeHandlers'), JSON.stringify({
        authData: variablesChangeHandler.authData,
        clientID: variablesChangeHandler.clientID,
        path: variablesChangeHandler.path,
        secret: variablesChangeHandler.secret,
        type: variablesChangeHandler.type,
        socketID: variablesChangeHandler.socketID,
        serverId: this.serverId,
      } as VariablesChangeHandler & { serverId: string }));

      return !!result;
    } catch (err) {
      this.logger.error('Error in `pushVariablesChangeHandler`.', err);
    } finally {
      lock.release().catch(error => this.logger.error('Error trying to release lock in `pushVariablesChangeHandler`', error));
    }

    return false;
  }

  async removeVariablesChangeHandler(variablesChangeHandler: VariablesChangeHandler) {
    try {
      return !!(await this.redisClient.lrem(this.getHandleKey('variablesChangeHandlers'), 1, JSON.stringify({
        // We need to respect same key order to be able to remove it successfully from redis.
        authData: variablesChangeHandler.authData,
        clientID: variablesChangeHandler.clientID,
        path: variablesChangeHandler.path,
        secret: variablesChangeHandler.secret,
        type: variablesChangeHandler.type,
        socketID: variablesChangeHandler.socketID,
        serverId: this.serverId,
      } as VariablesChangeHandler & { serverId: string })));
    } catch (err) {
      this.logger.error('Failed to remove variables change handler from redis.', variablesChangeHandler, err);
      return false;
    }
  }

  async pushAuthFunctionEventEventHandler(authFunctionEventHandler: AuthFunctionEventHandler) {
    const lock = await this.redlock.acquire([this.getHandleKey('authFunctionEventHandlers', 'lock')], 5000);

    try {
      const foundHandler = await this.findAuthFunctionEventHandlerBySocket(authFunctionEventHandler.socketID, authFunctionEventHandler.authFunctionId);

      if (foundHandler) {
        return false;
      }

      // We need to respect same key order to be able to remove it successfully from redis.
      const result = await this.redisClient.lpush(this.getHandleKey('authFunctionEventHandlers'), JSON.stringify({
        clientID: authFunctionEventHandler.clientID,
        authFunctionId: authFunctionEventHandler.authFunctionId,
        socketID: authFunctionEventHandler.socketID,
        serverId: this.serverId,
      } as AuthFunctionEventHandler & { serverId: string }));

      return !!result;
    } catch (err) {
      this.logger.error('Error in `pushAuthFunctionEventEventHandler`.', err);
    } finally {
      lock.release().catch(error => this.logger.error('Error trying to release lock in `pushAuthFunctionEventEventHandler`', error));
    }

    return false;
  }

  async getAuthFunctionEventHandlers(): Promise<(AuthFunctionEventHandler & { serverId: string })[]> {
    const authFunctionEventHandlers = await this.redisClient.lrange(this.getHandleKey('authFunctionEventHandlers'), 0, -1);

    return authFunctionEventHandlers.map(value => JSON.parse(value) as AuthFunctionEventHandler & { serverId: string });
  }

  async findAuthFunctionEventHandlerBySocket(socketID: string, authFunctionId: string) {
    const handlers = (await this.getAuthFunctionEventHandlers());

    return handlers.find(handler => handler.socketID === socketID && handler.authFunctionId === authFunctionId);
  }

  async removeAuthFunctionEventHandler(authFunctionEventHandler: AuthFunctionEventHandler) {
    try {
      return !!(await this.redisClient.lrem(this.getHandleKey('authFunctionEventHandlers'), 1, JSON.stringify({
        clientID: authFunctionEventHandler.clientID,
        authFunctionId: authFunctionEventHandler.authFunctionId,
        socketID: authFunctionEventHandler.socketID,
        serverId: this.serverId,
      } as AuthFunctionEventHandler & { serverId: string })));
    } catch (err) {
      this.logger.error('Failed to remove auth function handler from redis', authFunctionEventHandler, err);
      return false;
    }
  }

  private async cleanSocketListeners() {
    this.logger.debug('Cleaning handlers...');
    const [webhookHandleListeners, errorHandlers, variableChangeHandlers, variablesChangeHandlers, authFunctionEventHandlers] = await Promise.all([this.getWebhookHandleListeners(), this.getErrorHandlers(), this.getVariableChangeHandlers(), this.getVariablesChangeHandlers(), this.getAuthFunctionEventHandlers()]);

    let removedWebhookListenersCount = 0;
    const removeCalls: Promise<any>[] = [];

    for (const webhookHandleListener of webhookHandleListeners) {
      if (webhookHandleListener.serverId === this.serverId) {
        removeCalls.push(this.removeWebhookHandleListener(webhookHandleListener));
        removedWebhookListenersCount++;
      }
    }

    let removedErrorHandlersCount = 0;
    for (const errorHandler of errorHandlers) {
      if (errorHandler.serverId === this.serverId) {
        removeCalls.push(this.removeErrorhandler(errorHandler));
        removedErrorHandlersCount++;
      }
    }

    let variableChangeHandlersCount = 0;
    for (const variableChangeHandler of variableChangeHandlers) {
      if (variableChangeHandler.serverId === this.serverId) {
        removeCalls.push(this.removeVariableChangeHandler(variableChangeHandler));
        variableChangeHandlersCount++;
      }
    }

    let variablesChangeHandlersCount = 0;
    for (const variablesChangeHandler of variablesChangeHandlers) {
      if (variablesChangeHandler.serverId === this.serverId) {
        removeCalls.push(this.removeVariablesChangeHandler(variablesChangeHandler));
        variablesChangeHandlersCount++;
      }
    }

    let authFunctionEventHandlersCount = 0;
    for (const authFunctionEventHandler of authFunctionEventHandlers) {
      if (authFunctionEventHandler.serverId === this.serverId) {
        removeCalls.push(this.removeAuthFunctionEventHandler(authFunctionEventHandler));
        authFunctionEventHandlersCount++;
      }
    }

    await Promise.all(removeCalls);

    this.logger.debug(`Cleaned ${removedWebhookListenersCount} webhook handle listeners from redis.`);
    this.logger.debug(`Cleaned ${removedErrorHandlersCount} error handlers from redis.`);
    this.logger.debug(`Cleaned ${variableChangeHandlersCount} variable change handlers from redis.`);
    this.logger.debug(`Cleaned ${variablesChangeHandlersCount} variables change handlers from redis.`);
    this.logger.debug(`Cleaned ${authFunctionEventHandlersCount} auth function event handlers from redis.`);
  }

  private getHandleKey(name: string, prefix?: string) {
    return `${prefix ? `${prefix}:` : ''}poly-socket:${name}`;
  }

  private async findVariableChangeHandlerBySocket(socketID: string, variableId: string) {
    const handlers = (await this.getVariableChangeHandlers());

    return handlers.find(handler => handler.socketID === socketID && handler.variableId === variableId);
  }

  private async findVariablesChangeHandlerBySocket(socketID: string, path: string) {
    const handlers = (await this.getVariablesChangeHandlers());

    return handlers.find(handler => handler.socketID === socketID && handler.path === path);
  }

  private get redisClient() {
    const list = Array.from(this.redlock.clients.values());
    return list[0];
  }
};
