export interface WebhookHandleDto {
  id: string;
  context: string;
  name: string;
  eventType: string;
  urls: string[];
}
