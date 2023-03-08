export interface WebhookHandleDto {
  id: string;
  context: string;
  alias: string;
  eventType: string;
  urls: string[];
}
