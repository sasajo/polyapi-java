import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ErrorEvent } from '@poly/common';
import { AxiosError } from 'axios';

type ClientID = string;
type Path = string;

@Injectable()
export class EventService {
  private logger: Logger = new Logger(EventService.name);
  private readonly errorHandlers: Record<ClientID, Record<Path, Socket[]>> = {};

  registerErrorHandler(client: Socket, clientID: string, path: string) {
    this.logger.debug(`Registering error handler: ${clientID} '${path}'`);
    if (!this.errorHandlers[clientID]) {
      this.errorHandlers[clientID] = {};
    }
    if (!this.errorHandlers[clientID][path]) {
      this.errorHandlers[clientID][path] = [];
    }
    this.errorHandlers[clientID][path].push(client);

    client.on("disconnect", () => {
      this.logger.debug(`Client disconnected: ${clientID} '${path}'`);
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
      .filter(handlerPath => functionPath === handlerPath || functionPath.startsWith(`${handlerPath}.`) || functionPath.endsWith(`.${handlerPath}`));

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
}
