export interface ExecuteAuthFunctionDto {
  eventsClientId: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
  scopes?: string[];
  callbackUrl?: string;
}

export interface ExecuteAuthFunctionResponseDto {
  url?: string;
  token?: string;
}
