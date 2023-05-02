import { IsNotEmpty } from 'class-validator';

export class CreatePluginDto {
  @IsNotEmpty()
  slug: string;
  name?: string;
  iconUrl?: string;
  description?: string;
  functionIds?: string[];
}
