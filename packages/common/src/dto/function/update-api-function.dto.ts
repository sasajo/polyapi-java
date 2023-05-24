import { IsString, Validate, IsEnum, IsOptional } from 'class-validator';
import { ArgumentsMetadata } from '../../function';
import { NotContainDots } from '../validators';
import { Visibility } from '../../specs';

export class UpdateApiFunctionDto {
  @IsOptional()
  @IsString()
  @Validate(NotContainDots)
  name?: string;
  context?: string;
  description?: string;
  arguments?: ArgumentsMetadata;
  response?: any;
  payload?: string;
  @IsOptional()
  @IsString()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
