import { ArgumentType } from '../..';

export interface FunctionArgument {
  key: string;
  name: string;
  required?: boolean;
  secure?: boolean;
  type: ArgumentType;
  typeDeclarations?: string;
  typeObject?: object;
  payload?: boolean;
}

export interface FunctionBasicDto {
  id: string;
  context: string;
  name: string;
  description: string;
}

type FunctionType = 'url' | 'custom' | 'auth';

export interface FunctionDetailsDto extends FunctionBasicDto {
  arguments: FunctionArgument[];
  type: FunctionType;
}

export interface FunctionDefinitionDto {
  id: string;
  context: string;
  name: string;
  description: string;
  arguments: FunctionArgument[];
  returnTypeName: string;
  returnType?: string;
  customCode?: string;
  type: FunctionType;
}

export interface AuthFunctionDto {
  id: string;
  name: string;
  context: string;
  description: string;
  callbackUrl: string;
}
