export interface WebhookHandleDto {
  id: string;
  name: string;
  context: string;
  url: string;
}

export interface WebhookHandleDefinitionDto {
  id: string;
  name: string;
  context: string;
  eventTypeName: string;
  eventType: string;
}
