export interface WebhookHandleDto {
  id: string;
  name: string;
  context: string;
  description: string;
  url: string;
}

export interface WebhookHandleDefinitionDto {
  id: string;
  name: string;
  context: string;
  description: string;
  eventTypeName: string;
  eventType: string;
}
