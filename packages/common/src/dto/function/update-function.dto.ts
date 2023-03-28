import { ArgumentsMetadata } from '../../function';

export interface UpdateFunctionDto {
  name?: string;
  context?: string;
  description?: string;
  arguments?: ArgumentsMetadata;
}
