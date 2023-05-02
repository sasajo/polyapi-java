export class UpdateAuthProviderDto {
  context?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  audienceRequired?: boolean;
  refreshEnabled?: boolean;
  revokeUrl?: string | null;
  introspectUrl?: string | null;
}
