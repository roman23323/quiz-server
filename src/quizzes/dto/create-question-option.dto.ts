import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionOptionDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  orderIndex!: number;
}