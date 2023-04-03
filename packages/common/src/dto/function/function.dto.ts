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

export interface FunctionDetailsDto extends FunctionBasicDto {
  arguments: FunctionArgument[];
  type: 'url' | 'custom';
}

export interface FunctionDefinitionDto {
  id: string;
  context: string;
  name: string;
  description: string;
  arguments: FunctionArgument[];
  returnTypeName: string;
  returnType: string;
  customCode?: string;
}
