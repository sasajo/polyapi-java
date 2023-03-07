import { IsNotEmpty } from 'class-validator';
import { Body, Method, Headers } from '..';

export class TeachDto {

  @IsNotEmpty()
  url: string;
  @IsNotEmpty()
  method: Method;
  alias: string;
  headers: Headers;
  body: Body;
}
