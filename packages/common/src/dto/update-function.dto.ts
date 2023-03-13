import { ArgumentTypes } from '../poly-function';

export interface UpdateFunctionDto {
  alias?: string;
  context?: string;
  description?: string;
  argumentTypes?: ArgumentTypes;
}
