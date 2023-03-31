import { ArgumentType } from '../..';

export interface FunctionArgument {
  key: string;
  name: string;
  type: ArgumentType;
  typeDeclarations?: string;
  payload?: boolean;
}

export interface FunctionDto {
  id: string;
  context: string;
  name: string;
  description: string;
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
