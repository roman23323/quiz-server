import { IsEnum, IsUUID } from 'class-validator';
import { SessionMode } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    quizId!: string;

    @ApiProperty({ enum: SessionMode })
    @IsEnum(SessionMode)
    mode!: SessionMode;
}