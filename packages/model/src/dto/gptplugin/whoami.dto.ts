import { ApiProperty } from '@nestjs/swagger';

export class WhoAmIDto {
  userId: string;
  tenantId: string;
  environmentId: string;
  environmentSubdomain: string;
}

export class EmptyWhoAmIDto {
    @ApiProperty({
      type: 'null',
    })
    userId: null;
}
