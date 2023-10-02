import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class UpdateTriggerDto {
  @Matches(/^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/, {
    message: 'Name must be an empty string or consist of alphanumeric characters, \'-\', \'_\' or \'.\', and must start and end with an alphanumeric character',
  })
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsBoolean()
  waitForResponse?: boolean;
}
