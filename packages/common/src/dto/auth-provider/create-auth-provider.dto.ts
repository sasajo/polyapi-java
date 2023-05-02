import { IsNotEmpty } from 'class-validator';

export class CreateAuthProviderDto {
  @IsNotEmpty()
  context: string;
  @IsNotEmpty()
  authorizeUrl: string;
  @IsNotEmpty()
  tokenUrl: string;
  audienceRequired?: boolean;
  refreshEnabled?: boolean;
  revokeUrl?: string;
  introspectUrl?: string;
}
