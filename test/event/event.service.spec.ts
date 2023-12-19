/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test } from '@nestjs/testing';
import { EventService } from 'event/event.service';
import { Socket } from 'socket.io';
import { AuthService } from 'auth/auth.service';
import { authServiceMock } from '../mocks';
import { AuthData } from 'common/types';
import { EMITTER } from 'event/emitter/emitter.provider';
import emitterProviderMock from '../mocks/emitter.provider';
import crypto from 'crypto';
import { REDIS_CLIENT } from 'common/providers/redis-client.provider';
import { SocketStorage } from 'event/socket-storage/socket-storage.provider';
import { socketStorageMock, redisClientMock } from '../mocks';
import { Environment, Variable } from '@prisma/client';
import { Visibility } from '@poly/model';

describe('EventService', () => {
  let service: EventService;
  let socket1: Socket;
  let socket2: Socket;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: EMITTER,
          useValue: emitterProviderMock,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redisClientMock,
        },
        {
          provide: SocketStorage,
          useValue: socketStorageMock,
        },
      ],
    }).compile();

    service = module.get(EventService);

    socket1 = {
      id: 'socket1',
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
    } as any;

    socket2 = {
      id: 'socket2',
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerErrorHandler', () => {
    beforeEach(() => {
      jest.spyOn(crypto, 'randomUUID').mockReturnValue('foo');
    });

    it('should register handler with auth data', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.registerErrorHandler(socket1, authData, 'path');

      // Expect
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);

      expect(socketStorageMock.pushErrorHandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path',
        authData,
        applicationIds: undefined,
        environmentIds: undefined,
        functionIds: undefined,
        tenant: undefined,
        socketID: socket1.id,
      });
    });

    it('should register handler with applicationIds filter', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.registerErrorHandler(socket1, authData, 'path', ['app1']);

      // Expect
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socketStorageMock.pushErrorHandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path',
        authData,
        applicationIds: ['app1'],
        environmentIds: undefined,
        functionIds: undefined,
        tenant: undefined,
        socketID: socket1.id,
      });
    });

    it('should register handler with environmentsIds filter', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.registerErrorHandler(socket1, authData, 'path', undefined, ['env1']);

      // Expect
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socketStorageMock.pushErrorHandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path',
        authData,
        applicationIds: undefined,
        environmentIds: ['env1'],
        socketID: socket1.id,
      });
    });

    it('should register handler with functionIds filter', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.registerErrorHandler(socket1, authData, 'path', undefined, undefined, ['func1']);

      // Expect
      expect(socketStorageMock.pushErrorHandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path',
        authData,
        applicationIds: undefined,
        environmentIds: undefined,
        functionIds: ['func1'],
        socketID: socket1.id,
      });
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });

    it('should register handler with tenant filter', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.registerErrorHandler(socket1, authData, 'path', undefined, undefined, undefined, true);

      // Expect
      expect(socketStorageMock.pushErrorHandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path',
        authData,
        applicationIds: undefined,
        environmentIds: undefined,
        functionIds: undefined,
        tenant: true,
        socketID: socket1.id,
      });
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });
  });

  describe('unregisterErrorHandler', () => {
    it('removes handler socket', async () => {
      const authData = {
        key: 'key',
      } as AuthData;

      // Action
      await service.unregisterErrorHandler({
        authData,
        path: 'path1',
        applicationIds: ['foo'],
        environmentIds: ['foo'],
        id: 'foo',
        functionIds: ['foo'],
        tenant: true,
        socketID: socket1.id,
      });

      // Expect
      expect(socketStorageMock.removeErrorhandler).toHaveBeenCalledWith({
        id: 'foo',
        path: 'path1',
        authData,
        applicationIds: ['foo'],
        environmentIds: ['foo'],
        functionIds: ['foo'],
        tenant: true,
        socketID: socket1.id,
      });
    });
  });

  describe('sendErrorEvent', () => {
    const environmentEntity = {
      id: 'entity1',
      environmentId: 'env1',
      environment: {
        tenantId: 'tenant1',
      } as Environment,
      visibility: Visibility.Environment,
    };

    beforeEach(() => {
      authServiceMock.hasEnvironmentEntityAccess?.mockResolvedValue(true);
    });

    it('should send to handlers matching path', async () => {
      const authData = {
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        }, {
          authData,
          path: 'path2',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        null,
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith(`handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: null,
        userId: null,
      });
    });

    it('should not send to handlers not matching path', async () => {
      const authData = {
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        }, {
          authData,
          path: 'path2',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        null,
        null,
        'path3',
        error);

      // Expect
      expect(emitterProviderMock.to).not.toHaveBeenCalled();
      expect(emitterProviderMock.emit).not.toHaveBeenCalled();
    });

    it('should not send if no access based on auth data', async () => {
      const authData = {
        tenant: {
          id: 'tenant2',
        },
      } as AuthData;

      const handlers = [
        {
          authData,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        null,
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).not.toHaveBeenCalled();
      expect(emitterProviderMock.emit).not.toHaveBeenCalled();
    });

    it('should send only to specific application', async () => {
      const authData1 = {
        application: {
          id: 'app1',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const authData2 = {
        application: {
          id: 'app2',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData: authData1,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          authData: authData2,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        'app1',
        null,
        'path1',
        error);

      // Expect
      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith(`handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
    });

    it('should send only to defined applications', async () => {
      const authData1 = {
        application: {
          id: 'app1',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const authData2 = {
        application: {
          id: 'app2',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData: authData1,
          path: 'path1',
          applicationIds: ['app1'],
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          authData: authData2,
          path: 'path1',
          applicationIds: ['app1'],
          environmentIds: undefined,
          functionIds: undefined,
          tenant: undefined,
          id: 'id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        'app1',
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(1, socket1.id);
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(2, socket2.id);
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(1, `handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(2, `handleError:${handlers[1].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
    });

    it('should send only to defined environments', async () => {
      const authData1 = {
        application: {
          id: 'app1',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const authData2 = {
        application: {
          id: 'app2',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData: authData1,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: ['env1'],
          functionIds: undefined,
          tenant: undefined,
          id: 'id-1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          authData: authData2,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: ['env1'],
          functionIds: undefined,
          tenant: undefined,
          id: 'id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        'app1',
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(1, socket1.id);
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(2, socket2.id);
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(1, `handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(2, `handleError:${handlers[1].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
    });

    it('should send only to defined functions', async () => {
      const authData1 = {
        application: {
          id: 'app1',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const authData2 = {
        application: {
          id: 'app2',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const handlers = [
        {
          authData: authData1,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: ['entity1'],
          tenant: undefined,
          id: 'room-id',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          authData: authData2,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: ['entity2'],
          tenant: undefined,
          id: 'room-id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        'app1',
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith(`handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
    });

    it('should send only to auth data tenant', async () => {
      const authData1 = {
        application: {
          id: 'app1',
        },
        tenant: {
          id: 'tenant1',
        },
      } as AuthData;

      const authData2 = {
        application: {
          id: 'app2',
        },
        tenant: {
          id: 'tenant2',
        },
      } as AuthData;

      const handlers = [
        {
          authData: authData1,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: true,
          id: 'room-id',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          authData: authData2,
          path: 'path1',
          applicationIds: undefined,
          environmentIds: undefined,
          functionIds: undefined,
          tenant: true,
          id: 'room-id-2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
        },
      ];

      socketStorageMock.getErrorHandlers?.mockResolvedValue(handlers);

      const error = {
        message: 'errorMessage',
        data: {},
        status: 69,
        statusText: 'Test Error',
      };

      // Action
      await service.sendErrorEvent(
        environmentEntity.id,
        environmentEntity.environmentId,
        environmentEntity.environment.tenantId,
        environmentEntity.visibility,
        'app1',
        null,
        'path1',
        error);

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledTimes(1);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith(`handleError:${handlers[0].id}`, {
        ...error,
        functionId: environmentEntity.id,
        applicationId: 'app1',
        userId: null,
      });
    });
  });

  describe('registerWebhookEventHandler', () => {
    const authData = {
      environment: {
        id: 'env123',
      },
      tenant: {
        id: 'tenant123',
      },
    } as AuthData;

    it('registers new webhook handler', async () => {
      const webhookHandleID = 'webhook1';

      // Action
      await service.registerWebhookEventHandler(socket1, 'client1', webhookHandleID, authData);

      // Expect
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socketStorageMock.pushWebhookHandleListener).toHaveBeenCalledWith({
        webhookHandleID,
        clientID: 'client1',
        authData,
        socketID: socket1.id,
      });
    });

    it('adds socket to existing handler', async () => {
      const webhookHandleID = 'webhook1';

      // Action
      await service.registerWebhookEventHandler(socket1, 'client1', webhookHandleID, authData);
      await service.registerWebhookEventHandler(socket2, 'client1', webhookHandleID, authData);

      // Expect
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socket2.join).toHaveBeenCalledWith(socket2.id);
      expect(socketStorageMock.pushWebhookHandleListener).toHaveBeenNthCalledWith(1, {
        webhookHandleID,
        clientID: 'client1',
        authData,
        socketID: socket1.id,
      });
      expect(socketStorageMock.pushWebhookHandleListener).toHaveBeenNthCalledWith(2, {
        webhookHandleID,
        clientID: 'client1',
        authData,
        socketID: socket2.id,
      });
    });
  });

  describe('unregisterWebhookEventHandler', () => {
    const authData = {
      environment: {
        id: 'env123',
      },
      tenant: {
        id: 'tenant123',
      },
    } as AuthData;

    it('removes handler socket', async () => {
      const webhookHandleID = 'webhook1';

      // Action
      await service.unregisterWebhookEventHandler({
        clientID: 'client1',
        authData,
        webhookHandleID,
        socketID: socket1.id,
      });
      // Expect
      expect(socketStorageMock.removeWebhookHandleListener).toHaveBeenCalledWith({
        webhookHandleID,
        clientID: 'client1',
        authData,
        socketID: socket1.id,
      });
    });
  });

  describe('sendWebhookEvent', () => {
    const authData = {
      environment: {
        id: 'env123',
      },
      tenant: {
        id: 'tenant123',
      },
    } as AuthData;

    it('sends event to matching handlers', async () => {
      const handlers = [
        {
          webhookHandleID: 'webhook1',
          authData,
          clientID: 'client1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
        {
          webhookHandleID: 'webhook1',
          authData,
          clientID: 'client2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
        },
      ];

      socketStorageMock.getWebhookHandleListeners?.mockResolvedValue(handlers);

      // send event
      await service.sendWebhookEvent(
        'webhook1',
        null,
        { payload: 'data' },
        { header1: 'value1' },
        { param: 'value2' },
      );

      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(1, socket1.id);
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(2, socket2.id);

      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(1, 'handleWebhookEvent:webhook1', {
        body: { payload: 'data' },
        headers: { header1: 'value1' },
        params: { param: 'value2' },
      });
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(2, 'handleWebhookEvent:webhook1', {
        body: { payload: 'data' },
        headers: { header1: 'value1' },
        params: { param: 'value2' },
      });
    });

    it('does not send event if no matching handlers', async () => {
      const handlers = [
        {
          webhookHandleID: 'webhook1',
          authData,
          clientID: 'client1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ];

      socketStorageMock.getWebhookHandleListeners?.mockResolvedValue(handlers);

      // Action
      await service.sendWebhookEvent(
        'webhook2',
        null,
        { payload: 'data' },
        { header1: 'value1' },
        { param: 'value2' },
      );

      // Expect
      expect(emitterProviderMock.to).not.toHaveBeenCalled();
      expect(emitterProviderMock.emit).not.toHaveBeenCalled();
    });
  });
  // hasta aca
  describe('registerAuthFunctionEventHandler', () => {
    it('registers new auth function handler', async () => {
      const clientID = 'client1';
      const authFunctionId = 'func1';

      socketStorageMock.pushAuthFunctionEventEventHandler?.mockResolvedValue(true);

      // Action
      await service.registerAuthFunctionEventHandler(socket1, clientID, authFunctionId);

      // Expect
      expect(socketStorageMock.pushAuthFunctionEventEventHandler).toHaveBeenCalledWith({
        socketID: socket1.id,
        clientID,
        authFunctionId,
      });
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });

    it('adds socket to existing handler', async () => {
      const clientID = 'client1';
      const authFunctionId = 'func1';

      socketStorageMock.pushAuthFunctionEventEventHandler?.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      // Action
      await service.registerAuthFunctionEventHandler(socket1, clientID, authFunctionId);
      await service.registerAuthFunctionEventHandler(socket2, clientID, authFunctionId);

      expect(socketStorageMock.pushAuthFunctionEventEventHandler).toHaveBeenNthCalledWith(1, {
        socketID: socket1.id,
        clientID,
        authFunctionId,
      });

      expect(socketStorageMock.pushAuthFunctionEventEventHandler).toHaveBeenNthCalledWith(2, {
        socketID: socket2.id,
        clientID,
        authFunctionId,
      });

      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socket2.join).toHaveBeenCalledWith(socket2.id);
    });

    it('does not add duplicate socket', async () => {
      const clientID = 'client1';
      const authFunctionId = 'func1';

      socketStorageMock.pushAuthFunctionEventEventHandler?.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      // Action
      await service.registerAuthFunctionEventHandler(socket1, clientID, authFunctionId);
      await service.registerAuthFunctionEventHandler(socket1, clientID, authFunctionId);

      // Expect
      expect(socketStorageMock.pushAuthFunctionEventEventHandler).toHaveBeenNthCalledWith(1, {
        socketID: socket1.id,
        clientID,
        authFunctionId,
      });
      expect(socketStorageMock.pushAuthFunctionEventEventHandler).toHaveBeenNthCalledWith(2, {
        socketID: socket1.id,
        clientID,
        authFunctionId,
      });
      expect(socket1.join).toHaveBeenCalledTimes(1);
      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });
  });

  describe('unregisterAuthFunctionEventHandler', () => {
    it('removes handler socket', async () => {
      const clientID = 'client1';
      const authFunctionId = 'func1';

      // Action
      service.unregisterAuthFunctionEventHandler(socket1, clientID, authFunctionId);

      // Expect
      expect(socketStorageMock.removeAuthFunctionEventHandler).toHaveBeenCalledWith({
        socketID: socket1.id,
        clientID,
        authFunctionId,
      });
    });
  });

  describe('sendAuthFunctionEvent', () => {
    it('sends event to matching handler', async () => {
      const clientID = 'client1';
      const authFunctionId = 'func1';

      const handlers = [
        {
          authFunctionId,
          socketID: socket1.id,
          clientID,
          serverId: socketStorageMock.serverId,
        },
      ];

      socketStorageMock.getAuthFunctionEventHandlers?.mockResolvedValue(handlers);

      // Action
      await service.sendAuthFunctionEvent(authFunctionId, clientID, { payload: 'data' });

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith('handleAuthFunctionEvent:func1', { payload: 'data' });
    });

    it('sends to all clients if clientId not specified', async () => {
      const authFunctionId = 'func1';

      const handlers = [
        {
          authFunctionId,
          socketID: socket1.id,
          clientID: 'client1',
          serverId: socketStorageMock.serverId,
        },
        {
          authFunctionId,
          socketID: socket2.id,
          clientID: 'client2',
          serverId: socketStorageMock.serverId,
        },
      ];

      socketStorageMock.getAuthFunctionEventHandlers?.mockResolvedValue(handlers);

      // Action
      await service.sendAuthFunctionEvent(authFunctionId, null, { payload: 'data' });

      // Expect
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(1, socket1.id);
      expect(emitterProviderMock.to).toHaveBeenNthCalledWith(2, socket2.id);

      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(1, `handleAuthFunctionEvent:${authFunctionId}`, { payload: 'data' });
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(2, `handleAuthFunctionEvent:${authFunctionId}`, { payload: 'data' });
    });

    it('does not send event if no matching handlers', () => {
      const handlers = [];

      socketStorageMock.getAuthFunctionEventHandlers?.mockResolvedValue(handlers);

      // Action
      service.sendAuthFunctionEvent('func1', 'client1', { payload: 'data' });

      // Expect
      expect(emitterProviderMock.to).not.toBeCalled();
    });
  });

  // ...other tests

  describe('registerVariableChangeEventHandler', () => {
    it('registers new variable change handler', async () => {
      const clientID = 'client1';
      const variableId = 'var1';

      socketStorageMock.pushVariableChangeHandler?.mockResolvedValue(true);

      // Action
      await service.registerVariableChangeEventHandler(socket1, clientID, variableId);

      expect(socketStorageMock.pushVariableChangeHandler).toHaveBeenCalledWith({
        clientID,
        variableId,
        socketID: socket1.id,
      });

      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });

    it('adds socket to existing handler', async () => {
      const clientID = 'client1';
      const variableId = 'var1';

      socketStorageMock.pushVariableChangeHandler?.mockResolvedValue(true);

      await service.registerVariableChangeEventHandler(socket1, clientID, variableId);
      await service.registerVariableChangeEventHandler(socket2, clientID, variableId);

      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
      expect(socket2.join).toHaveBeenCalledWith(socket2.id);

      expect(socketStorageMock.pushVariableChangeHandler).toHaveBeenNthCalledWith(1, {
        clientID,
        variableId,
        socketID: socket1.id,
      });

      expect(socketStorageMock.pushVariableChangeHandler).toHaveBeenNthCalledWith(2, {
        clientID,
        variableId,
        socketID: socket2.id,
      });
    });

    it('does not add duplicate socket', async () => {
      const clientID = 'client1';
      const variableId = 'var1';

      socketStorageMock.pushVariableChangeHandler?.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await service.registerVariableChangeEventHandler(socket1, clientID, variableId);
      await service.registerVariableChangeEventHandler(socket1, clientID, variableId);

      expect(socket1.join).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterVariableChangeEventHandler', () => {
    it('removes handler socket', async () => {
      const clientID = 'client1';
      const variableId = 'var1';

      // unregister
      await service.unregisterVariableChangeEventHandler(socket1, 'client1', 'var1');

      expect(socketStorageMock.removeVariableChangeHandler).toHaveBeenCalledWith({
        clientID,
        variableId,
        socketID: socket1.id,
      });
    });
  });

  describe('sendVariableChangeEvent', () => {
    beforeEach(() => {
      authServiceMock.hasEnvironmentEntityAccess?.mockResolvedValue(true);

      // Mock this here for easier handling in tests.
      socketStorageMock.getVariablesChangeHandlers?.mockResolvedValue([]);
      socketStorageMock.getVariableChangeHandlers?.mockResolvedValue([]);
    });

    it('sends event to matching handler', async () => {
      const clientID = 'client1';
      const variableId = 'var1';

      socketStorageMock.getVariableChangeHandlers?.mockResolvedValue([
        {
          clientID,
          variableId,
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
        },
      ]);

      const variable = {
        id: 'var1',
      } as Variable;

      // Action
      await service.sendVariableChangeEvent(variable, {
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        path: 'path',
        secret: false,
        updateTime: 123456789,
        updatedBy: 'user',
        updatedFields: ['value'],
      });

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.emit).toHaveBeenCalledWith(`handleVariableChangeEvent:${variableId}`, {
        id: 'var1',
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        secret: false,
        updatedBy: 'user',
        updatedFields: ['value'],
      });
    });

    it('sends to all clients', async () => {
      const clientID = 'client1';
      const variableId = 'var1';
      const clientID2 = 'client2';
      const variableId2 = 'var1';

      socketStorageMock.getVariableChangeHandlers?.mockResolvedValue([
        {
          clientID,
          variableId,
          socketID: socket1.id,
          serverId: socketStorageMock.serverId,
        },
        {
          clientID: clientID2,
          variableId: variableId2,
          socketID: socket2.id,
          serverId: socketStorageMock.serverId,
        },
      ]);

      const variable = {
        id: 'var1',
      } as Variable;

      // send event
      await service.sendVariableChangeEvent(variable, {
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        path: 'path',
        secret: false,
        updateTime: 123456789,
        updatedBy: 'user',
        updatedFields: ['value'],
      });

      // check all sockets emit called

      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(1, `handleVariableChangeEvent:${variableId}`, {
        id: 'var1',
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        updatedFields: ['value'],
      });
      expect(emitterProviderMock.emit).toHaveBeenNthCalledWith(2, `handleVariableChangeEvent:${variableId2}`, {
        id: 'var1',
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        updatedFields: ['value'],
      });
    });

    it('does not send event if no matching handlers', async () => {
      // TODO: continue with this.
      const variable = {
        id: 'var1',
      } as Variable;

      // send event
      await service.sendVariableChangeEvent(variable, {
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        path: 'path',
        updatedFields: ['value'],
      });

      // check nothing emitted
      expect(emitterProviderMock.to).not.toBeCalled();
    });

    it('sends to matching variables change handlers by path', async () => {
      const clientID = 'client1';
      const clientID2 = 'client2';

      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      socketStorageMock.getVariablesChangeHandlers?.mockResolvedValue([
        {
          authData,
          clientID,
          path: 'path1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
          secret: false,
          type: 'update',
        },
        {
          authData,
          clientID: clientID2,
          path: 'path2',
          serverId: socketStorageMock.serverId,
          socketID: socket2.id,
          secret: false,
          type: 'update',
        },
      ]);

      const variable = {
        id: 'var123',
        environmentId: 'env123',
      } as Variable;

      // Action
      await service.sendVariableChangeEvent(variable, {
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        path: 'path1.var123',
        updatedFields: ['value'],
      });

      // Expect
      expect(emitterProviderMock.to).toHaveBeenCalledWith(socket1.id);
      expect(emitterProviderMock.to).toHaveBeenCalledTimes(1);

      expect(emitterProviderMock.emit).toHaveBeenCalledTimes(1);
    });

    it('does not send to variables change handler for different path', async () => {
      const clientID = 'client1';

      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      socketStorageMock.getVariablesChangeHandlers?.mockResolvedValue([
        {
          authData,
          clientID,
          path: 'path1',
          serverId: socketStorageMock.serverId,
          socketID: socket1.id,
          secret: false,
          type: 'update',
        },
      ]);

      const variable = {
        id: 'var123',
        environmentId: 'env123',
      } as Variable;

      // Action
      await service.sendVariableChangeEvent(variable, {
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        path: 'path2.var123',
        updatedFields: ['value'],
      });

      // Expect
      expect(emitterProviderMock.to).not.toHaveBeenCalled();
      expect(emitterProviderMock.emit).not.toHaveBeenCalled();
    });
  });

  describe('registerVariablesChangeEventHandler', () => {
    it('registers new variables change handler', async () => {
      const clientID = 'client1';
      const path = 'path1';
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      socketStorageMock.pushVariablesChangeHandler?.mockResolvedValue(true);

      // Action
      await service.registerVariablesChangeEventHandler(socket1, 'client1', authData, path);

      // Expect
      expect(socketStorageMock.pushVariablesChangeHandler).toHaveBeenCalledWith({
        authData,
        clientID,
        path,
        secret: undefined,
        type: undefined,
        socketID: socket1.id,
      });

      expect(socket1.join).toHaveBeenCalledWith(socket1.id);
    });

    it('adds socket to existing handler', async () => {
      const clientID = 'client1';
      const path = 'path1';
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      socketStorageMock.pushVariablesChangeHandler?.mockResolvedValue(true);

      await service.registerVariablesChangeEventHandler(socket1, clientID, authData, path);
      await service.registerVariablesChangeEventHandler(socket2, clientID, authData, path);

      expect(socketStorageMock.pushVariablesChangeHandler).toHaveBeenNthCalledWith(1, {
        authData,
        clientID,
        path,
        secret: undefined,
        type: undefined,
        socketID: socket1.id,
      });

      expect(socketStorageMock.pushVariablesChangeHandler).toHaveBeenNthCalledWith(2, {
        authData,
        clientID,
        path,
        secret: undefined,
        type: undefined,
        socketID: socket2.id,
      });
    });
  });
});
