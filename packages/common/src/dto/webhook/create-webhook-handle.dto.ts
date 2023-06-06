import { IsNotEmpty } from 'class-validator';

export class CreateWebhookHandleDto {
  @IsNotEmpty()
  name: string;
  context: string;
  eventPayload: any;
  description: string;
}
