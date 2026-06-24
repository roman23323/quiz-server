import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: QuizVisibility })
  @IsEnum(QuizVisibility)
  visibility!: QuizVisibility;

  @ApiProperty({ minimum: 5 })
  @IsInt()
  @Min(5)
  secondsPerQuestion!: number;
}