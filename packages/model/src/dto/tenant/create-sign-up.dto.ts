import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateSignUpDto {
    @IsEmail()
    email: string;

    @ApiProperty({
      required: false,
    })
    @IsString()
    @IsOptional()
    tenantName?: string;
}
