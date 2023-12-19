import { Test } from '@nestjs/testing';
import redisClientMock from '../mocks/redis-client.provider';
import { SocketStorage } from 'event/socket-storage/socket-storage.provider';
import { REDLOCK } from 'common/providers/redlock.provider';
import { redlockMock } from '../mocks';

describe('SocketStorageProvider', () => {
  let service: SocketStorage;

  const releaseSpy = jest.fn().mockResolvedValue({});

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SocketStorage,
        {
          provide: REDLOCK,
          useValue: redlockMock,
        },
      ],
    }).compile();

    service = module.get(SocketStorage);

    redlockMock.acquire?.mockResolvedValue({
      release: releaseSpy,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWebhookHandleListeners', () => {
    it('Should return parsed data.', async () => {
      const webhookHandleListener: Awaited<ReturnType<typeof service.getWebhookHandleListeners>>[number] = {
        authData: {
          application: null,
        } as any,
        clientID: 'client',
        socketID: '1',
        webhookHandleID: 'foo',
        serverId: 'serverId',
      };
      redisClientMock.lrange?.mockResolvedValue([JSON.stringify(webhookHandleListener)]);

      const result = await service.getWebhookHandleListeners();

      expect(result[0]).toStrictEqual(webhookHandleListener);
    });
  });

  describe('getErrorHandlers', () => {
    it('Should return parsed data.', async () => {
      const errorHandler: Awaited<ReturnType<typeof service.getErrorHandlers>>[number] = {
        authData: {} as any,
        id: '',
        path: '',
        socketID: '1',
        serverId: 'serverId',
      };
      redisClientMock.lrange?.mockResolvedValue([JSON.stringify(errorHandler)]);

      const result = await service.getErrorHandlers();

      expect(result[0]).toStrictEqual(errorHandler);
    });
  });

  describe('getVariableChangeHandlers', () => {
    it('Should return parsed data.', async () => {
      const variableChangeHandler: Awaited<ReturnType<typeof service.getVariableChangeHandlers>>[number] = {
        clientID: 'client',
        serverId: 'serverId',
        socketID: '1',
        variableId: 'var',
      };
      redisClientMock.lrange?.mockResolvedValue([JSON.stringify(variableChangeHandler)]);

      const result = await service.getVariableChangeHandlers();

      expect(result[0]).toStrictEqual(variableChangeHandler);
    });
  });

  describe('getVariablesChangeHandlers', () => {
    it('Should return parsed data.', async () => {
      const variablesChangeHandler: Awaited<ReturnType<typeof service.getVariablesChangeHandlers>>[number] = {
        clientID: 'client',
        serverId: 'serverId',
        socketID: '1',
        authData: {} as any,
        path: '',
        type: 'update',
      };
      redisClientMock.lrange?.mockResolvedValue([JSON.stringify(variablesChangeHandler)]);

      const result = await service.getVariablesChangeHandlers();

      expect(result[0]).toStrictEqual(variablesChangeHandler);
    });
  });

  describe('getAuthFunctionEventHandlers', () => {
    it('Should return parsed data.', async () => {
      const authFunctionHandler: Awaited<ReturnType<typeof service.getAuthFunctionEventHandlers>>[number] = {
        clientID: 'client',
        serverId: 'serverId',
        socketID: '1',
        authFunctionId: 'id',
      };
      redisClientMock.lrange?.mockResolvedValue([JSON.stringify(authFunctionHandler)]);

      const result = await service.getAuthFunctionEventHandlers();

      expect(result[0]).toStrictEqual(authFunctionHandler);
    });
  });

  describe('findVariableChangeHandlerBySocket', () => {
    it('Should return variable change handler.', async () => {
      const variableChangeHandlers = [
        {
          clientID: 'client',
          serverId: 'serverId',
          socketID: '1',
          variableId: 'var',
        }, {
          clientID: 'client',
          serverId: 'serverId',
          socketID: '2',
          variableId: 'var',
        },
      ];

      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue(variableChangeHandlers);

      const result = await service['findVariableChangeHandlerBySocket']('1', 'var');

      expect(result).toStrictEqual(variableChangeHandlers[0]);
    });

    it('Should return `undefined` if not found.', async () => {
      const variableChangeHandlers = [
        {
          clientID: 'client',
          serverId: 'serverId',
          socketID: '1',
          variableId: 'var',
        },
      ];

      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue(variableChangeHandlers);

      const result = await service['findVariableChangeHandlerBySocket']('2', 'var');

      expect(result).toBe(undefined);
    });
  });

  describe('findVariablesChangeHandlerBySocket', () => {
    it('Should return variable change handler.', async () => {
      const variablesChangeHandlers = [
        {
          clientID: 'client',
          socketID: '1',
          authData: {} as any,
          path: '',
          serverId: 'serverId',
        }, {
          clientID: 'client',
          socketID: '2',
          authData: {} as any,
          path: '',
          serverId: 'serverId',
        },
      ] as Awaited<ReturnType<typeof service.getVariablesChangeHandlers>>;

      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue(variablesChangeHandlers);

      const result = await service['findVariablesChangeHandlerBySocket']('1', '');

      expect(result).toStrictEqual(variablesChangeHandlers[0]);
    });

    it('Should return `undefined` if not found.', async () => {
      const variablesChangeHandlers = [
        {
          clientID: 'client',
          socketID: '1',
          authData: {} as any,
          path: '',
          serverId: 'serverId',
        },
      ] as Awaited<ReturnType<typeof service.getVariablesChangeHandlers>>;

      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue(variablesChangeHandlers);

      const result = await service['findVariablesChangeHandlerBySocket']('2', '');

      expect(result).toBe(undefined);
    });
  });

  describe('getAuthFunctionEventHandler', () => {
    it('Should return auth function event handler.', async () => {
      const authFunctionEventHandlers = [
        {
          clientID: 'client',
          socketID: '1',
          serverId: 'serverId',
          authFunctionId: 'id',
        }, {
          clientID: 'client',
          socketID: '2',
          serverId: 'serverId',
          authFunctionId: 'id',
        },
      ] as Awaited<ReturnType<typeof service.getAuthFunctionEventHandlers>>;

      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue(authFunctionEventHandlers);

      const result = await service.findAuthFunctionEventHandlerBySocket('1', 'id');

      expect(result).toStrictEqual(authFunctionEventHandlers[0]);
    });

    it('Should return `undefined` if no auth function event handler is found.', async () => {
      const authFunctionEventHandlers = [
        {
          clientID: 'client',
          socketID: '1',
          serverId: 'serverId',
          authFunctionId: 'id',
        },
      ] as Awaited<ReturnType<typeof service.getAuthFunctionEventHandlers>>;

      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue(authFunctionEventHandlers);

      const result = await service.findAuthFunctionEventHandlerBySocket('2', 'id');

      expect(result).toBe(undefined);
    });
  });

  describe('pushWebhookHandleListener', () => {
    it('Should push a webhook event listener.', async () => {
      const key = service['getHandleKey']('webhookHandleListeners');

      const data = {
        webhookHandleID: 'id',
        authData: {} as any,
        clientID: 'clientID',
        socketID: '1',
      } as Parameters<typeof service.pushWebhookHandleListener>[0];

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushWebhookHandleListener(data);

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        ...data,
        serverId: service.getServerId(),
      }));

      expect(result).toBe(true);
    });
  });

  describe('pushErrorHandler', () => {
    it('Should push an error hanlder.', async () => {
      const key = service['getHandleKey']('errorHandlers');

      const data = {
        authData: {} as any,
        id: 'id',
        path: 'path',
        socketID: '1',
      } as Parameters<typeof service.pushErrorHandler>[0];

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushErrorHandler(data);

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        ...data,
        serverId: service.getServerId(),
      }));

      expect(result).toBe(true);
    });
  });

  describe('pushVariableChangeHandler', () => {
    it('registers new variable change handler', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('variableChangeHandlers', 'lock');
      const key = service['getHandleKey']('variableChangeHandlers');

      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue([]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushVariableChangeHandler({
        clientID: 'clientID',
        socketID: '1',
        variableId: 'id',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        clientID: 'clientID',
        variableId: 'id',
        socketID: '1',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('adds socket to existing handler', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('variableChangeHandlers', 'lock');
      const key = service['getHandleKey']('variableChangeHandlers');

      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          socketID: '1',
          variableId: 'var',
          serverId: service.getServerId(),
        },
      ]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushVariableChangeHandler({
        clientID: 'clientID',
        socketID: '2',
        variableId: 'var',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        clientID: 'clientID',
        variableId: 'var',
        socketID: '2',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('does not add duplicate socket.', async () => {
      const lockTimeout = 5000;
      const key = service['getHandleKey']('variableChangeHandlers', 'lock');

      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          serverId: 'serverId',
          socketID: '1',
          variableId: 'var',
        },
      ]);

      const result = await service.pushVariableChangeHandler({
        clientID: 'clientID',
        socketID: '1',
        variableId: 'var',
      });

      expect(redlockMock.acquire).toHaveBeenCalledWith([key], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(redisClientMock.lpush).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('pushVariablesChangeHandler', () => {
    it('registers new variables change handler', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('variablesChangeHandlers', 'lock');
      const key = service['getHandleKey']('variablesChangeHandlers');

      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue([]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushVariablesChangeHandler({
        clientID: 'clientID',
        socketID: '2',
        authData: {} as any,
        path: '',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        socketID: '2',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('adds socket to existing handler', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('variablesChangeHandlers', 'lock');
      const key = service['getHandleKey']('variablesChangeHandlers');

      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          socketID: '1',
          authData: {} as any,
          path: '',
          serverId: service.getServerId(),
        },
      ]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushVariablesChangeHandler({
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        socketID: '2',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        socketID: '2',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('does not add duplicate socket.', async () => {
      const lockTimeout = 5000;
      const key = service['getHandleKey']('variablesChangeHandlers', 'lock');

      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          serverId: 'serverId',
          socketID: '1',
          authData: {} as any,
          path: '',
        },
      ]);

      const result = await service.pushVariablesChangeHandler({
        clientID: 'clientID',
        socketID: '1',
        authData: {} as any,
        path: '',
      });

      expect(redlockMock.acquire).toHaveBeenCalledWith([key], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(false);
      expect(redisClientMock.lpush).not.toHaveBeenCalled();
    });
  });

  describe('pushAuthFunctionEventEventHandler', () => {
    it('registers new auth function event handler.', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('authFunctionEventHandlers', 'lock');
      const key = service['getHandleKey']('authFunctionEventHandlers');

      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue([]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushAuthFunctionEventEventHandler({
        clientID: 'clientID',
        socketID: '2',
        authFunctionId: 'id',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        clientID: 'clientID',
        authFunctionId: 'id',
        socketID: '2',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('adds socket to existing handler', async () => {
      const lockTimeout = 5000;
      const lockKey = service['getHandleKey']('authFunctionEventHandlers', 'lock');
      const key = service['getHandleKey']('authFunctionEventHandlers');

      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          socketID: '1',
          serverId: service.getServerId(),
          authFunctionId: 'id',
        },
      ]);

      redisClientMock.lpush?.mockResolvedValue(1);

      const result = await service.pushAuthFunctionEventEventHandler({
        clientID: 'clientID',
        authFunctionId: 'id',
        socketID: '2',
      });

      expect(redisClientMock.lpush).toHaveBeenCalledWith(key, JSON.stringify({
        clientID: 'clientID',
        authFunctionId: 'id',
        socketID: '2',
        serverId: service.getServerId(),
      }));
      expect(redlockMock.acquire).toHaveBeenCalledWith([lockKey], lockTimeout);
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('does not add duplicate socket.', async () => {
      const lockTimeout = 5000;
      const key = service['getHandleKey']('authFunctionEventHandlers', 'lock');

      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue([
        {
          clientID: 'clientID',
          serverId: 'serverId',
          socketID: '1',
          authFunctionId: 'id',
        },
      ]);

      const result = await service.pushAuthFunctionEventEventHandler({
        clientID: 'clientID',
        authFunctionId: 'id',
        socketID: '1',
      });

      expect(redlockMock.acquire).toHaveBeenCalledWith([key], lockTimeout);
      expect(redisClientMock.lpush).not.toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('removeWebhookHandleListener', () => {
    it('Should remove webhook handle listener and return true.', async () => {
      const key = service['getHandleKey']('webhookHandleListeners');

      const webhookHandleListener = {
        webhookHandleID: 'id',
        authData: {} as any,
        clientID: 'clientID',
        socketID: '1',
      };

      redisClientMock.lrem?.mockResolvedValue(1);

      const result = await service.removeWebhookHandleListener(webhookHandleListener);

      expect(redisClientMock.lrem).toHaveBeenCalledWith(key, 1, JSON.stringify({
        ...webhookHandleListener,
        serverId: service.getServerId(),
      }));
      expect(result).toBe(true);
    });
  });

  describe('removeErrorhandler', () => {
    it('Should remove error handler and return true.', async () => {
      const key = service['getHandleKey']('errorHandlers');

      const errorHandler = {
        authData: {} as any,
        id: 'id',
        path: '',
        socketID: '1',
      };

      redisClientMock.lrem?.mockResolvedValue(1);

      const result = await service.removeErrorhandler(errorHandler);

      expect(redisClientMock.lrem).toHaveBeenCalledWith(key, 1, JSON.stringify({
        ...errorHandler,
        serverId: service.getServerId(),
      }));
      expect(result).toBe(true);
    });
  });

  describe('removeVariableChangeHandler', () => {
    it('Should remove error variable change handler and return true.', async () => {
      const key = service['getHandleKey']('variableChangeHandlers');

      const variableChangeHandler = {
        clientID: 'clientID',
        socketID: '1',
        variableId: 'id',
      };

      redisClientMock.lrem?.mockResolvedValue(1);

      const result = await service.removeVariableChangeHandler(variableChangeHandler);

      expect(redisClientMock.lrem).toHaveBeenCalledWith(key, 1, JSON.stringify({
        clientID: 'clientID',
        variableId: 'id',
        socketID: '1',
        serverId: service.getServerId(),
      }));
      expect(result).toBe(true);
    });
  });

  describe('removeVariablesChangeHandler', () => {
    it('Should remove error variables change handler and return true.', async () => {
      const key = service['getHandleKey']('variablesChangeHandlers');

      redisClientMock.lrem?.mockResolvedValue(1);

      const result = await service.removeVariablesChangeHandler({
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        socketID: '1',
      });

      expect(redisClientMock.lrem).toHaveBeenCalledWith(key, 1, JSON.stringify({
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        socketID: '1',
        serverId: service.getServerId(),
      }));
      expect(result).toBe(true);
    });
  });

  describe('removeAuthFunctionEventHandler', () => {
    it('Should remove an auth functiont event handler and return true.', async () => {
      const key = service['getHandleKey']('authFunctionEventHandlers');

      redisClientMock.lrem?.mockResolvedValue(1);

      const result = await service.removeAuthFunctionEventHandler({
        authFunctionId: 'id',
        clientID: 'clientID',
        socketID: '1',
      });

      expect(redisClientMock.lrem).toHaveBeenCalledWith(key, 1, JSON.stringify({
        clientID: 'clientID',
        authFunctionId: 'id',
        socketID: '1',
        serverId: service.getServerId(),
      }));
      expect(result).toBe(true);
    });
  });

  describe('cleanSocketListeners', () => {
    it('Should remove all handlers that belong to this server.', async () => {
      const webhookHandleListener = {
        authData: {} as any,
        clientID: 'clientID',
        serverId: service.getServerId(),
        socketID: '1',
        webhookHandleID: 'id',
      };

      const errorHandler = {
        authData: {} as any,
        id: 'id',
        path: '',
        serverId: service.getServerId(),
        socketID: '1',
      };

      const variableChangeHandler = {
        clientID: 'clientID',
        serverId: service.getServerId(),
        socketID: '1',
        variableId: 'id',
      };

      const variablesChangeHandler = {
        authData: {} as any,
        clientID: 'clientID',
        path: '',
        serverId: service.getServerId(),
        socketID: '1',
      };

      const authFunctionEventHandler = {
        authFunctionId: 'id',
        clientID: 'clientID',
        serverId: service.getServerId(),
        socketID: '1',
      };

      jest.spyOn(service, 'getWebhookHandleListeners').mockResolvedValue([
        webhookHandleListener,
        {
          ...webhookHandleListener,
          serverId: 'foo',
        },
      ]);
      jest.spyOn(service, 'getErrorHandlers').mockResolvedValue([
        errorHandler,
        {
          ...errorHandler,
          serverId: 'foo',
        },
      ]);
      jest.spyOn(service, 'getVariableChangeHandlers').mockResolvedValue([
        variableChangeHandler,
        {
          ...variableChangeHandler,
          serverId: 'foo',
        },
      ]);
      jest.spyOn(service, 'getVariablesChangeHandlers').mockResolvedValue([
        variablesChangeHandler,
        {
          ...variablesChangeHandler,
          serverId: 'foo',
        },
      ]);
      jest.spyOn(service, 'getAuthFunctionEventHandlers').mockResolvedValue([
        authFunctionEventHandler,
        {
          ...authFunctionEventHandler,
          serverId: 'foo',
        },
      ]);

      const removeWebhookHandleListenerSpy = jest.spyOn(service, 'removeWebhookHandleListener').mockImplementation((() => Promise.resolve()) as any);
      const removeErrorhandlerSpy = jest.spyOn(service, 'removeErrorhandler').mockImplementation((() => Promise.resolve()) as any);
      const removeVariableChangeHandlerSpy = jest.spyOn(service, 'removeVariableChangeHandler').mockImplementation((() => Promise.resolve()) as any);
      const removeVariablesChangeHandlerSpy = jest.spyOn(service, 'removeVariablesChangeHandler').mockImplementation((() => Promise.resolve()) as any);
      const removeAuthFunctionEventHandlerSpy = jest.spyOn(service, 'removeAuthFunctionEventHandler').mockImplementation((() => Promise.resolve()) as any);

      // Action

      await service['cleanSocketListeners']();

      expect(removeWebhookHandleListenerSpy).toHaveBeenCalledTimes(1);
      expect(removeWebhookHandleListenerSpy).toHaveBeenCalledWith(webhookHandleListener);

      expect(removeErrorhandlerSpy).toHaveBeenCalledTimes(1);
      expect(removeErrorhandlerSpy).toHaveBeenCalledWith(errorHandler);

      expect(removeVariableChangeHandlerSpy).toHaveBeenCalledTimes(1);
      expect(removeVariableChangeHandlerSpy).toHaveBeenCalledWith(variableChangeHandler);

      expect(removeVariablesChangeHandlerSpy).toHaveBeenCalledTimes(1);
      expect(removeVariablesChangeHandlerSpy).toHaveBeenCalledWith(variablesChangeHandler);

      expect(removeAuthFunctionEventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(removeAuthFunctionEventHandlerSpy).toHaveBeenCalledWith(authFunctionEventHandler);
    });
  });
});
