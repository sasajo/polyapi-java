import { SocketStorage } from 'event/socket-storage/socket-storage.provider';
import { TypedMock, getFnMock } from '../utils/test-utils';

export default {
  serverId: 'serverId',
  pushErrorHandler: getFnMock<SocketStorage['pushErrorHandler']>(),
  pushWebhookHandleListener: getFnMock<SocketStorage['pushWebhookHandleListener']>(),
  pushAuthFunctionEventEventHandler: getFnMock<SocketStorage['pushAuthFunctionEventEventHandler']>(),
  pushVariableChangeHandler: getFnMock<SocketStorage['pushVariableChangeHandler']>(),
  pushVariablesChangeHandler: getFnMock<SocketStorage['pushVariablesChangeHandler']>(),
  removeErrorhandler: getFnMock<SocketStorage['removeErrorhandler']>(),
  removeWebhookHandleListener: getFnMock<SocketStorage['removeWebhookHandleListener']>(),
  removeAuthFunctionEventHandler: getFnMock<SocketStorage['removeAuthFunctionEventHandler']>(),
  removeVariableChangeHandler: getFnMock<SocketStorage['removeVariableChangeHandler']>(),
  removeVariablesChangeHandler: getFnMock<SocketStorage['removeVariablesChangeHandler']>(),
  getErrorHandlers: getFnMock<SocketStorage['getErrorHandlers']>(),
  getWebhookHandleListeners: getFnMock<SocketStorage['getWebhookHandleListeners']>(),
  getAuthFunctionEventHandlers: getFnMock<SocketStorage['getAuthFunctionEventHandlers']>(),
  findVariableChangeHandlerBySocket: getFnMock<SocketStorage['findVariableChangeHandlerBySocket']>(),
  getVariableChangeHandlers: getFnMock<SocketStorage['getVariableChangeHandlers']>(),
  findVariablesChangeHandlerBySocket: getFnMock<SocketStorage['findVariablesChangeHandlerBySocket']>(),
  getVariablesChangeHandlers: getFnMock<SocketStorage['getVariablesChangeHandlers']>(),
} as TypedMock<SocketStorage> & { serverId: string };
