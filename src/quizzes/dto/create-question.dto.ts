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
import { ApiProperty } from '@nestjs/swagger';

import { CreateQuestionOptionDto } from './create-question-option.dto';

enum QuestionType {
  single_choice = 'single_choice',
  text = 'text',
}

export class CreateQuestionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  points!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  orderIndex!: number;

  @ApiProperty({ type: () => CreateQuestionOptionDto, isArray: true, required: false, minItems: 1 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}