import { IsString } from 'class-validator';

export class WebhookSecurityFunction {
  @IsString()
  id: string;
}
