import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ChatText } from '@poly/common';
import { catchError, lastValueFrom, map } from 'rxjs';
import { ConfigService } from 'config/config.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly httpService: HttpService, private readonly config: ConfigService) {
  }

  public async getMessageResponseTexts(userId: number, message: string): Promise<ChatText[]> {
    this.logger.debug(`Sending message to Science server: ${message}`);
    const toResponseTexts = (response: string): ChatText[] => {
      return [{
        type: 'markdown',
        value: response,
      }];
    };

    return await lastValueFrom(
      this.httpService.post(`${this.config.scienceServerBaseUrl}/function-completion`, {
        user_id: userId,
        question: message,
      }).pipe(
        map(response => response.data),
        map(toResponseTexts),
      ).pipe(
        catchError(error => {
          this.logger.error(`Error while communicating with Science server: ${error}`);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );
  }

  async processCommand(userId: string, command: string) {
    this.logger.debug(`Processing chat command: ${command}`);
    const [commandName] = command.split(' ');

    switch (commandName) {
      case 'clear':
        await lastValueFrom(
          this.httpService.post(`${this.config.scienceServerBaseUrl}/clear-conversation`, {
            user_id: userId,
          }).pipe(
            catchError(error => {
              this.logger.error(`Error while communicating with Science server: ${error}`);
              throw new HttpException(error.response.data, error.response.status);
            }),
          ),
        );
        break;
    }
  }
}
