export interface FunctionDescriptionDto {
  name: string;
  context: string;
  description: string;
  arguments: {
    name: string;
    description: string;
  }[];
}
