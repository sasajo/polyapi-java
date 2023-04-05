export interface ExecuteAuthFunctionDto {
  eventsClientId: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}

export interface ExecuteAuthFunctionResponseDto {
  url?: string;
  token?: string;
}
