import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (typeof dto.name === 'string' && dto.name.indexOf('\0') !== -1) {
      throw new BadRequestException('Invalid characters in name');
    }
    if (typeof dto.password === 'string' && dto.password.indexOf('\0') !== -1) {
      throw new BadRequestException('Invalid characters in password');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: {
        name: dto.name
      }
    });

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        passwordHash,
      },
    });

    return {
      token: await this.generateToken(user),
      user: { id: user.id, name: user.name, isGuest: user.isGuest, role: user.role }
    };
  }

  async login(dto: LoginDto) {
    if (typeof dto.name === 'string' && dto.name.indexOf('\0') !== -1) {
      throw new BadRequestException('Invalid characters in name');
    }
    if (typeof dto.password === 'string' && dto.password.indexOf('\0') !== -1) {
      throw new BadRequestException('Invalid characters in password');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        name: dto.name
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: await this.generateToken(user),
      user: {
        id: user.id,
        name: user.name,
        isGuest: user.isGuest,
        role: user.role,
      }
    };
  }
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      role: user.role,
    };

    return await this.jwtService.signAsync(payload);
  }
}