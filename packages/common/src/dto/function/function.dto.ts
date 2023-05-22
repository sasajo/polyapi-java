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
  location?: 'url' | 'body' | 'headers' | 'auth';
}

export interface FunctionBasicDto {
  id: string;
  context: string;
  name: string;
  description: string;
}

type FunctionType = 'api' | 'client' | 'server';

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

export interface ApiFunctionDefinitionDto extends FunctionDefinitionDto {
  type: 'api';
}

export interface CustomFunctionDefinitionDto extends FunctionDefinitionDto {
  type: 'client' | 'server';
  customCode: string;
}
