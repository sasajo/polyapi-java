import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetAllFunctionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(','))
  contexts?: string[];
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(','))
  names?: string[];
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(','))
  ids?: string[];
}
