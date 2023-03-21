import { IsOptional } from 'class-validator';

export class GetAllFunctionsDto {
  @IsOptional()
  contexts?: string[];
  @IsOptional()
  names?: string[];
  @IsOptional()
  ids?: string[];
}
