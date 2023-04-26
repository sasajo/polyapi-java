import { IsNotEmpty } from 'class-validator';
import { Body, Method, Header, Auth } from '../..';

export class TeachDto {
  @IsNotEmpty()
  url: string;
  @IsNotEmpty()
  method: Method;
  name: string;
  description: string;
  headers: Header[];
  body: Body;
  auth?: Auth;
}
