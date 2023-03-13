import { ArgumentTypes } from '../poly-function';

export interface UpdateFunctionDto {
  name?: string;
  context?: string;
  description?: string;
  argumentTypes?: ArgumentTypes;
}
