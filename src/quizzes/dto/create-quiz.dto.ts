import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum QuizVisibility {
  public = 'public',
  private = 'private',
  unlisted = 'unlisted',
}

export class CreateQuizDto {
  @ApiProperty({ maxLength: 128 })
  @IsString()
  @MaxLength(128)
  title!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: QuizVisibility, default: QuizVisibility.public })
  @IsEnum(QuizVisibility)
  visibility!: QuizVisibility;

  @ApiProperty({ minimum: 5, maximum: 1000, type: 'integer' })
  @IsInt()
  @Min(5)
  @Max(1000)
  secondsPerQuestion!: number;
}