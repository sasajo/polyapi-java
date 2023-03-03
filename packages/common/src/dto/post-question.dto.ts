import { IsNotEmpty } from 'class-validator';

export class PostQuestionDto {
  @IsNotEmpty()
  message: string;
}
