/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test } from '@nestjs/testing';
import { EventService } from 'event/event.service';
import { Socket } from 'socket.io';
import { AuthService } from 'auth/auth.service';
import { authServiceMock } from '../mocks';
import { Variable } from '@prisma/client';
import { AuthData } from 'common/types';

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
      ],
    }).compile();

    service = module.get(EventService);

    socket1 = {
      id: 'socket1',
      emit: jest.fn(),
      on: jest.fn(),
    } as any;

    socket2 = {
      id: 'socket2',
      emit: jest.fn(),
      on: jest.fn(),
    } as any;
  });

  describe('registerErrorHandler', () => {
    it('registers new error handler', () => {
      service.registerErrorHandler(socket1, 'client1', 'path1');

      // @ts-ignore
      expect(service.errorHandlers['client1']['path1']).toEqual([socket1]);
    });

    it('adds socket to existing handler', () => {
      service.registerErrorHandler(socket1, 'client1', 'path1');
      service.registerErrorHandler(socket2, 'client1', 'path1');

      // @ts-ignore
      expect(service.errorHandlers['client1']['path1']).toEqual([socket1, socket2]);
    });
  });

  describe('unregisterErrorHandler', () => {
    it('removes handler socket', () => {
      // register handler
      service.registerErrorHandler(socket1, 'client1', 'path1');

      // unregister
      service.unregisterErrorHandler(socket1, 'client1', 'path1');

      // @ts-ignore
      expect(service.errorHandlers['client1']['path1']).toEqual([]);
    });

    it('does not throw error if handler does not exist', () => {
      expect(() => {
        service.unregisterErrorHandler(socket1, 'client1', 'path1');
      }).not.toThrow();
    });
  });

  describe('sendErrorEvent', () => {
    it('sends event to matching handler', () => {
      // register handler
      service.registerErrorHandler(socket1, 'client1', 'path1');

      // send event
      service.sendErrorEvent('client1', 'path1', { message: 'Error' });

      // check socket emit called
      expect(socket1.emit).toBeCalledWith('handleError:path1', { message: 'Error' });
    });

    it('does not send event if no matching handler', () => {
      // send event
      const sent = service.sendErrorEvent('client1', 'path1', { message: 'Error' });

      // check nothing emitted
      expect(sent).toBe(false);
      expect(socket1.emit).not.toBeCalled();
    });
  });

  describe('registerWebhookEventHandler', () => {
    it('registers new webhook handler', () => {
      service.registerWebhookEventHandler(socket1, 'client1', 'webhook1');

      // @ts-ignore
      expect(service.webhookEventHandlers['client1']['webhook1']).toEqual([socket1]);
    });

    it('adds socket to existing handler', () => {
      service.registerWebhookEventHandler(socket1, 'client1', 'webhook1');
      service.registerWebhookEventHandler(socket2, 'client1', 'webhook1');

      // @ts-ignore
      expect(service.webhookEventHandlers['client1']['webhook1']).toEqual([socket1, socket2]);
    });
  });

  describe('unregisterWebhookEventHandler', () => {
    it('removes handler socket', () => {
      // register handler
      service.registerWebhookEventHandler(socket1, 'client1', 'webhook1');

      // unregister
      service.unregisterWebhookEventHandler(socket1, 'client1', 'webhook1');

      // @ts-ignore
      expect(service.webhookEventHandlers['client1']['webhook1']).toEqual([]);
    });

    it('does not throw error if handler does not exist', () => {
      expect(() => {
        service.unregisterWebhookEventHandler(socket1, 'client1', 'webhook1');
      }).not.toThrow();
    });
  });

  describe('sendWebhookEvent', () => {
    it('sends event to matching handlers', () => {
      // register handlers
      service.registerWebhookEventHandler(socket1, 'client1', 'webhook1');
      service.registerWebhookEventHandler(socket2, 'client2', 'webhook1');

      // send event
      service.sendWebhookEvent('webhook1', { payload: 'data' });

      // check socket emits called
      expect(socket1.emit).toBeCalledWith('handleWebhookEvent:webhook1', { payload: 'data' });
      expect(socket2.emit).toBeCalledWith('handleWebhookEvent:webhook1', { payload: 'data' });
    });

    it('does not send event if no matching handlers', () => {
      // send event
      service.sendWebhookEvent('webhook1', { payload: 'data' });

      // check nothing emitted
      expect(socket1.emit).not.toBeCalled();
      expect(socket2.emit).not.toBeCalled();
    });
  });

  describe('registerAuthFunctionEventHandler', () => {
    it('registers new auth function handler', () => {
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');

      // @ts-ignore
      expect(service.authFunctionHandlers['client1']['func1']).toEqual([socket1]);
    });

    it('adds socket to existing handler', () => {
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');
      service.registerAuthFunctionEventHandler(socket2, 'client1', 'func1');

      // @ts-ignore
      expect(service.authFunctionHandlers['client1']['func1']).toEqual([socket1, socket2]);
    });

    it('does not add duplicate socket', () => {
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');

      // @ts-ignore
      expect(service.authFunctionHandlers['client1']['func1']).toEqual([socket1]);
    });
  });

  describe('unregisterAuthFunctionEventHandler', () => {
    it('removes handler socket', () => {
      // register handler
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');

      // unregister
      service.unregisterAuthFunctionEventHandler(socket1, 'client1', 'func1');

      // @ts-ignore
      expect(service.authFunctionHandlers['client1']['func1']).toEqual([]);
    });

    it('does not throw error if handler does not exist', () => {
      expect(() => {
        service.unregisterAuthFunctionEventHandler(socket1, 'client1', 'func1');
      }).not.toThrow();
    });
  });

  describe('sendAuthFunctionEvent', () => {
    it('sends event to matching handler', () => {
      // register handler
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');

      // send event
      service.sendAuthFunctionEvent('func1', 'client1', { payload: 'data' });

      // check socket emit called
      expect(socket1.emit).toBeCalledWith('handleAuthFunctionEvent:func1', { payload: 'data' });
    });

    it('sends to all clients if clientId not specified', () => {
      // register handlers
      service.registerAuthFunctionEventHandler(socket1, 'client1', 'func1');
      service.registerAuthFunctionEventHandler(socket2, 'client2', 'func1');

      // send event without clientId
      service.sendAuthFunctionEvent('func1', null, { payload: 'data' });

      // check all sockets emit called
      expect(socket1.emit).toBeCalledWith('handleAuthFunctionEvent:func1', { payload: 'data' });
      expect(socket2.emit).toBeCalledWith('handleAuthFunctionEvent:func1', { payload: 'data' });
    });

    it('does not send event if no matching handlers', () => {
      // send event
      service.sendAuthFunctionEvent('func1', 'client1', { payload: 'data' });

      // check nothing emitted
      expect(socket1.emit).not.toBeCalled();
    });
  });

  // ...other tests

  describe('registerVariableChangeEventHandler', () => {
    it('registers new variable change handler', () => {
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');

      // @ts-ignore
      expect(service.variableChangeHandlers['client1']['var1']).toEqual([socket1]);
    });

    it('adds socket to existing handler', () => {
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');
      service.registerVariableChangeEventHandler(socket2, 'client1', 'var1');

      // @ts-ignore
      expect(service.variableChangeHandlers['client1']['var1']).toEqual([socket1, socket2]);
    });

    it('does not add duplicate socket', () => {
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');

      // @ts-ignore
      expect(service.variableChangeHandlers['client1']['var1']).toEqual([socket1]);
    });
  });

  describe('unregisterVariableChangeEventHandler', () => {
    it('removes handler socket', () => {
      // register handler
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');

      // unregister
      service.unregisterVariableChangeEventHandler(socket1, 'client1', 'var1');

      // @ts-ignore
      expect(service.variableChangeHandlers['client1']['var1']).toEqual([]);
    });

    it('does not throw error if handler does not exist', () => {
      expect(() => {
        service.unregisterVariableChangeEventHandler(socket1, 'client1', 'var1');
      }).not.toThrow();
    });
  });

  describe('sendVariableChangeEvent', () => {
    beforeEach(() => {
      authServiceMock.hasEnvironmentEntityAccess?.mockResolvedValue(true);
    });

    it('sends event to matching handler', async () => {
      // register handler
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');

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

      // check socket emit called
      expect(socket1.emit).toBeCalledWith('handleVariableChangeEvent:var1', {
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
      // register handlers
      service.registerVariableChangeEventHandler(socket1, 'client1', 'var1');
      service.registerVariableChangeEventHandler(socket2, 'client2', 'var1');

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
      expect(socket1.emit).toBeCalledWith('handleVariableChangeEvent:var1', {
        id: 'var1',
        type: 'update',
        previousValue: 'old value',
        currentValue: 'new value',
        updateTime: 123456789,
        updatedBy: 'user',
        secret: false,
        updatedFields: ['value'],
      });
      expect(socket2.emit).toBeCalledWith('handleVariableChangeEvent:var1', {
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
      expect(socket1.emit).not.toBeCalled();
    });

    it('sends to matching variables change handlers by path', async () => {
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      // register handlers
      service.registerVariablesChangeEventHandler(socket1, 'client1', authData, 'path1');
      service.registerVariablesChangeEventHandler(socket2, 'client2', authData, 'path2');

      const variable = {
        id: 'var123',
        environmentId: 'env123',
      } as Variable;

      // send event
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

      // check socket1 emitted
      expect(socket1.emit).toBeCalled();

      // check socket2 did not emit
      expect(socket2.emit).not.toBeCalled();
    });

    it('does not send to variables change handler for different path', async () => {
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;
      // register handler
      service.registerVariablesChangeEventHandler(socket1, 'client1', authData, 'path1');

      const variable = {
        id: 'var123',
      } as Variable;

      // send event
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

      // check nothing emitted
      expect(socket1.emit).not.toBeCalled();
    });
  });

  describe('registerVariablesChangeEventHandler', () => {
    it('registers new variables change handler', () => {
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      service.registerVariablesChangeEventHandler(socket1, 'client1', authData, 'path1');

      // @ts-ignore
      expect(service.variablesChangeHandlers['client1']['path1']).toEqual([
        {
          socket: socket1,
          authData,
        },
      ]);
    });

    it('adds socket to existing handler', () => {
      const authData = {
        environment: {
          id: 'env123',
        },
        tenant: {
          id: 'tenant123',
        },
      } as AuthData;

      service.registerVariablesChangeEventHandler(socket1, 'client1', authData, 'path1');
      service.registerVariablesChangeEventHandler(socket2, 'client1', authData, 'path1');

      // @ts-ignore
      expect(service.variablesChangeHandlers['client1']['path1']).toEqual([
        { socket: socket1, authData },
        { socket: socket2, authData },
      ]);
    });
  });
});
