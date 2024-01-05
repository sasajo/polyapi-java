import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreateTenantAgreement {
    @IsString()
    tosId: string;

    @ApiProperty({
      required: false,
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({
      required: false,
      description: 'If not provided, is generated automatically.',
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    agreedAt?: Date;
}
