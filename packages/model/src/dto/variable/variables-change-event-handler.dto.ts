import { VariableChangeEventType } from './variable-change-event.dto';

export interface VariablesChangeEventHandlerDto {
  path: string;
  apiKey: string;
  clientID: string;
  options?: {
    type?: VariableChangeEventType;
    secret?: boolean;
  }
}
