import { Body, Controller, Post, All, Req, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiExcludeEndpoint,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'User created' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiConflictResponse({ description: 'Conflict - username exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @All('register')
  @ApiExcludeEndpoint()
  otherMethodsRegister(@Req() req: any, @Res() res: Response) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
  }

  @Post('login')
  @ApiOkResponse({ description: 'Authenticated' })
  @ApiCreatedResponse({ description: 'Created' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @All('login')
  @ApiExcludeEndpoint()
  otherMethodsLogin(@Req() req: any, @Res() res: Response) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
  }
}