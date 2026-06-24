import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
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

    @ApiProperty({ minimum: 0 })
    @IsInt()
    @Min(0)
    responseTimeMs!: number;
}