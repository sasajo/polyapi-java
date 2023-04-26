import { Body, Variables } from '../..';
import { IsNotEmpty } from 'class-validator';

export class TeachDetailsDto {
  name?: string;
  context?: string;
  description?: string;
  payload?: string;
  @IsNotEmpty()
  url: string;
  body: Body;
  response: any;
  variables?: Variables;
  statusCode: number;
}
