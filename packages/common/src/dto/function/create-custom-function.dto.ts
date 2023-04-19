import { IsNotEmpty } from 'class-validator';

export class CreateCustomFunctionDto {
  @IsNotEmpty()
  name: string;
  context?: string;
  @IsNotEmpty()
  code: string;
  server?: boolean;
}
