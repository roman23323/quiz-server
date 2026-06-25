import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionOptionDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({ minimum: 0, maximum: 6, type: 'integer' })
  @IsInt()
  @Min(0)
  @Max(6)
  orderIndex!: number;
}