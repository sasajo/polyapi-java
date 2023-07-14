export interface VariableChangeEvent {
  type: 'update' | 'delete';
  previousValue: any;
  currentValue: any;
  updateTime: number;
  updatedBy: string;
}
