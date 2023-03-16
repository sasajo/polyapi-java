import { IsNotEmpty } from 'class-validator';
import { Body, Method, Headers, Auth } from '../..';

export class TeachDto {

  @IsNotEmpty()
  url: string;
  @IsNotEmpty()
  method: Method;
  name: string;
  headers: Headers;
  body: Body;
  auth?: Auth;
}
