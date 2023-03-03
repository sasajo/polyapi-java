import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ChatText } from '@poly/common';
import { catchError, lastValueFrom, map } from 'rxjs';

const TRAIN_SERVER_BASE_URL = process.env.TRAIN_SERVER_BASE_URL;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly httpService: HttpService) {
  }

  public async getMessageResponseTexts(message: string): Promise<ChatText[]> {
    const toResponseTexts = (response: string): ChatText[] => {
      return [{
        type: 'markdown',
        value: response,
      }];
    };

    return await lastValueFrom(
      this.httpService.post(`${TRAIN_SERVER_BASE_URL}/function-completion`, {
        question: message,
      }).pipe(
        map(response => response.data),
        map(toResponseTexts),
      ).pipe(
        catchError(error => {
          this.logger.error(`Error while communicating with Train server: ${error}`);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );
  }
}
