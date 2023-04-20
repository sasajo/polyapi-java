import { ArgumentType } from '../..';

export interface FunctionArgument {
  key: string;
  name: string;
  required?: boolean;
  secure?: boolean;
  type: ArgumentType;
  typeSchema?: string;
  typeObject?: object;
  payload?: boolean;
}

export interface FunctionBasicDto {
  id: string;
  context: string;
  name: string;
  description: string;
}

type FunctionType = 'url' | 'custom' | 'auth' | 'server';

export interface FunctionDetailsDto extends FunctionBasicDto {
  arguments: FunctionArgument[];
  type: FunctionType;
}

export interface FunctionDefinitionDto {
  id: string;
  type: FunctionType;
  context: string;
  name: string;
  description: string;
  arguments: FunctionArgument[];
  returnTypeName: string;
  returnType?: string;
}

export interface UrlFunctionDefinitionDto extends FunctionDefinitionDto {
  type: 'url';
}

export interface CustomFunctionDefinitionDto extends FunctionDefinitionDto {
  type: 'custom' | 'server';
  customCode: string;
}

export interface AuthFunctionDefinitionDto extends FunctionDefinitionDto {
  type: 'auth';
  audienceRequired: boolean;
}

export interface AuthFunctionDto {
  id: string;
  name: string;
  context: string;
  description: string;
  callbackUrl: string;
}
