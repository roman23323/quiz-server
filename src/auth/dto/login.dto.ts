import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ pattern: '^[^\\u0000]*$' })
  @IsString()
  name!: string;

  @ApiProperty({ pattern: '^[^\\u0000]*$' })
  @IsString()
  password!: string;
}