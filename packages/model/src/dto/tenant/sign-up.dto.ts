import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
    @ApiProperty({
      nullable: true,
    })
    name: string | null;

    email: string;
    id: string;
}
