import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateQuestionOptionDto } from './create-question-option.dto';

enum QuestionType {
  single_choice = 'single_choice',
  text = 'text',
}

export class CreateQuestionDto {
  @IsString()
  text!: string;

  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsInt()
  @Min(1)
  points!: number;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}