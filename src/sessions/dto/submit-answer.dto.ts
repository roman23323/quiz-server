import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class SubmitAnswerDto {
    @IsUUID()
    questionId!: string;

    @IsOptional()
    @IsUUID()
    selectedOptionId?: string;

    @IsOptional()
    @IsString()
    textAnswer?: string;

    @IsInt()
    @Min(0)
    responseTimeMs!: number;
}