import { IsEnum, IsUUID } from 'class-validator';
import { SessionMode } from '@prisma/client';

export class CreateSessionDto {
    @IsUUID()
    quizId!: string;

    @IsEnum(SessionMode)
    mode!: SessionMode;
}