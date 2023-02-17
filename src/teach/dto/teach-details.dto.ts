import { Body, Method, Headers } from 'common/types';
import { IsNotEmpty } from 'class-validator';

export class TeachDetailsDto {

  functionAlias: string;
  context: string;
  response: unknown;
}
