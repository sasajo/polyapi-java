import { Body, Method, Headers } from 'common/types';
import { IsNotEmpty } from 'class-validator';

export class TeachDto {

  @IsNotEmpty()
  url: string;
  @IsNotEmpty()
  method: Method;
  alias: string;
  headers: Headers;
  body: Body;
}
