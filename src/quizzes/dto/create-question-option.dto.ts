import { IsBoolean, IsInt, IsString, Min } from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsInt()
  @Min(0)
  orderIndex: number;
}