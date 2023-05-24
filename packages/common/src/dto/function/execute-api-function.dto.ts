export interface ExecuteApiFunctionDto {
  clientID: string;
  args: Record<string, any>;
}

export interface ApiFunctionResponseDto {
  status: number;
  data: any;
  headers: Record<string, string>;
}
