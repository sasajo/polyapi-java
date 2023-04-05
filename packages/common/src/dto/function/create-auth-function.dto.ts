import { IsNotEmpty } from 'class-validator';

export class CreateAuthFunctionDto {
  @IsNotEmpty()
  name: string;
  context?: string;
  description?: string;
  @IsNotEmpty()
  authUrl: string;
  @IsNotEmpty()
  accessTokenUrl: string;
}
