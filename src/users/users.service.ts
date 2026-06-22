import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findByName(name: string) {
        const user = await this.prisma.user.findUnique({
            where: { name },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                isGuest: true,
                createdAt: true
            }
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDTO) {
        if (updateUserDto.name) {
            const existingUserByName = await this.prisma.user.findUnique({
                where: {
                    name: updateUserDto.name
                }
            });

            if (existingUserByName) {
                throw new BadRequestException('Username already exists');
            }
        }

        let passwordHash: string | undefined = undefined
        if (updateUserDto.password) {
            passwordHash = await bcrypt.hash(updateUserDto.password, 10)
        }

        return this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name: updateUserDto.name,
                passwordHash
            },
            select: {
                id: true,
                name: true,
                isGuest: true,
                createdAt: true
            }
        });
    }

    deleteUser(userId: string) {
        return this.prisma.user.delete({
            where: { id: userId }
        })
    }
}
