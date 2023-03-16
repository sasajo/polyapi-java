import { IsNotEmpty } from 'class-validator';

export class RegisterWebhookHandleDto {
  @IsNotEmpty()
  name: string;
  context: string;
  eventPayload: any;
}
