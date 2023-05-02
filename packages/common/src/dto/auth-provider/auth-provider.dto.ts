export class AuthProviderDto {
  id: string;
  context: string;
  authorizeUrl: string;
  tokenUrl: string;
  audienceRequired: boolean;
  refreshEnabled: boolean;
  revokeUrl: string | null;
  introspectUrl: string | null;
  callbackUrl: string;
}
