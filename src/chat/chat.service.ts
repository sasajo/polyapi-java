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
          this.logger.error(`Error while communicating with Train server: ${error}`);
          throw new HttpException(error.response.data, error.response.status);
        }),
      ),
    );
  }
}
