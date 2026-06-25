import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    questionId!: string;

    @ApiProperty({ format: 'uuid', required: false })
    @IsOptional()
    @IsUUID()
    selectedOptionId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    textAnswer?: string;

    @ApiProperty({ minimum: 0, maximum: 1000, type: 'integer' })
    @IsInt()
    @Min(0)
    @Max(1000)
    responseTimeMs!: number;
}