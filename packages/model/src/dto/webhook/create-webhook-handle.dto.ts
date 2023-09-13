import { IsArray, IsEnum, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Validate } from 'class-validator';
import { ContextIdentifier, NameIdentifier } from '../validators';
import { Visibility } from '../../specs';

export class CreateWebhookHandleDto {
  @IsNotEmpty()
  @Validate(NameIdentifier)
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Validate(ContextIdentifier)
  context?: string;

  @IsObject()
  eventPayload: any;

  description: string;

  @IsOptional()
  @IsString()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsObject()
  responsePayload?: any;

  @IsOptional()
  @IsObject()
  responseHeaders?: any;

  @IsOptional()
  @IsNumber()
  responseStatus?: number;

  @IsOptional()
  @IsString()
  subpath?: string;

  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  securityFunctionIds?: string[];
}
