import { ValueType } from './variable.dto';

export interface ContextVariableValues {
  [key: string]: ContextVariableValues | ValueType;
}
