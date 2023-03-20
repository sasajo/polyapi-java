import { ArgumentType } from '../..';

export interface FunctionArgument {
  name: string;
  type: ArgumentType;
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
  arguments: FunctionArgument[];
  returnType: string;
  customCode?: string;
}
