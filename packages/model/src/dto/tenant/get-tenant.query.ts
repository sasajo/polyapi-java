import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetTenantQuery {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @ApiProperty({ required: false })
  full?: boolean;
}
