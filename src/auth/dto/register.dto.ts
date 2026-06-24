import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ minLength: 3, maxLength: 32 })
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    name!: string;

    @ApiProperty({ minLength: 6, maxLength: 128 })
    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password!: string;
}