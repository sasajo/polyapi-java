import { IsEnum, IsString } from 'class-validator';
import { Visibility } from '../../specs';

export class UpdateCustomFunctionDto {
  context?: string;
  description?: string;
  @IsString()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
