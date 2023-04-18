import { IsNotEmpty } from 'class-validator';

export class CreatePluginDto {
  @IsNotEmpty()
  slug: string;
  @IsNotEmpty()
  functionIds: string[];
}
