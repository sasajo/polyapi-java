export interface ErrorEvent {
  message: string;
  data?: unknown;
  status?: number;
  statusText?: string;
}
