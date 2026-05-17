import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findByName(name: string) {
        return this.prisma.user.findUnique({
            where: { name },
        });
    }

    findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
}
