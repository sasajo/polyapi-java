export type VariableChangeEventType = 'update' | 'delete';

export interface VariableChangeEvent {
  path: string;
  secret: boolean;
  type: VariableChangeEventType;
  previousValue: any;
  currentValue: any;
  updateTime: number;
  updatedBy: string;
  updatedFields: ('value' | 'secret')[];
}
