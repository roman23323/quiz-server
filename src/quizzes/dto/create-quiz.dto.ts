import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

enum QuizVisibility {
  public = 'public',
  private = 'private',
  unlisted = 'unlisted',
}

export class CreateQuizDto {
  @IsString()
  @MaxLength(128)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(QuizVisibility)
  visibility: QuizVisibility;

  @IsInt()
  @Min(5)
  secondsPerQuestion: number;
}