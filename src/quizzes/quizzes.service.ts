import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        authorId,

        title: dto.title,
        description: dto.description,

        visibility: dto.visibility,

        secondsPerQuestion: dto.secondsPerQuestion,
      },
    });
  }

  async findMyQuizzes(userId: string) {
    return this.prisma.quiz.findMany({
      where: {
        authorId: userId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPublicQuizzes() {
    return this.prisma.quiz.findMany({
      where: {
        visibility: 'public',
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}