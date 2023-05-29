import { UserDto } from '../user';

export class TeamDto {
  id: string;
  name: string;
}

export class TeamFullDto extends TeamDto {
  users: UserDto[];
}
