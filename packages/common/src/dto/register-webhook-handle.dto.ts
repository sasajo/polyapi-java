export interface RegisterWebhookHandleDto {
  name: string;
  context: string;
  eventPayload: unknown;
}
