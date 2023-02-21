import { ArgumentType, ReturnType } from '../types';

export type FunctionArgument = {
  name: string;
  type: ArgumentType;
}

export type FunctionDto = {
  id: string;
  context: string;
  name: string;
  arguments: FunctionArgument[];
  returnType: ReturnType;
}
