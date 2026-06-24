import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuizzesService {
    constructor(private prisma: PrismaService) { }

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

    async deleteQuiz(quizId: string, userId: string, userRole?: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You are not author');
        }

        return this.prisma.quiz.delete({
            where: { id: quizId }
        })
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
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(
        quizId: string,
        userId: string,
        userRole: string | undefined,
        dto: UpdateQuizDto,
    ) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException();
        }

        return this.prisma.quiz.update({
            where: {
                id: quizId,
            },

            data: {
                title: dto.title,
                description: dto.description,
                visibility: dto.visibility,
                secondsPerQuestion: dto.secondsPerQuestion,
            },
        });
    }

    private async ensureQuizAndAuthor(quizId: string, userId: string, userRole?: string) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException();
        }

        return quiz;
    }

    async createQuestion(
        quizId: string,
        userId: string,
        dto: CreateQuestionDto,
        userRole: string | undefined,
    ) {
        await this.ensureQuizAndAuthor(quizId, userId, userRole);

        if (
            dto.questionType === 'single_choice' &&
            (!dto.options || dto.options.length === 0)
        ) {
            throw new BadRequestException(
                'Single choice question must contain options',
            );
        }

        if (
            dto.questionType === 'text' &&
            !dto.correctAnswer
        ) {
            throw new BadRequestException(
                'Text question must contain correctAnswer',
            );
        }

        const optionsCreate = dto.options
            ? dto.options.map((option) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  orderIndex: option.orderIndex,
              }))
            : undefined;

        return this.prisma.quizQuestion.create({
            data: {
                quizId,

                text: dto.text,

                questionType: dto.questionType,

                correctAnswer: dto.correctAnswer,

                points: dto.points,

                orderIndex: dto.orderIndex,

                options: optionsCreate
                    ? {
                          create: optionsCreate,
                      }
                    : undefined,
            },

            include: {
                options: true,
            },
        });
    }

    async updateQuestion(
        quizId: string,
        userId: string,
        userRole: string | undefined,
        dto: CreateQuestionDto,
    ) {
        await this.ensureQuizAndAuthor(quizId, userId, userRole);

        const existingById = await this.prisma.quizQuestion.findUnique({ where: { id: dto.id } });

        if (!existingById) {
            throw new NotFoundException('Question not found');
        }

        if (existingById.quizId !== quizId) {
            throw new BadRequestException('Question does not belong to this quiz');
        }

        if (
            dto.questionType === 'single_choice' &&
            (!dto.options || dto.options.length === 0)
        ) {
            throw new BadRequestException(
                'Single choice question must contain options',
            );
        }

        if (
            dto.questionType === 'text' &&
            !dto.correctAnswer
        ) {
            throw new BadRequestException(
                'Text question must contain correctAnswer',
            );
        }

        const optionsCreate = dto.options
            ? dto.options.map((option) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  orderIndex: option.orderIndex,
              }))
            : undefined;

        return this.prisma.quizQuestion.update({
            where: { id: dto.id },
            data: {
                text: dto.text,
                questionType: dto.questionType,
                correctAnswer: dto.correctAnswer,
                points: dto.points,
                orderIndex: dto.orderIndex,
                options: optionsCreate
                    ? {
                          deleteMany: {},
                          create: optionsCreate,
                      }
                    : undefined,
            },
            include: { options: true },
        });
    }

    async findOneForEdit(quizId: string, userId: string, userRole?: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
            },

            include: {
                questions: {
                    orderBy: {
                        orderIndex: 'asc',
                    },

                    include: {
                        options: {
                            orderBy: {
                                orderIndex: 'asc',
                            },
                        },
                    },
                },
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException();
        }

        return quiz;
    }

    async findOneForPlay(quizId: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
            },

            select: {
                id: true,
                title: true,
                description: true,
                visibility: true,
                secondsPerQuestion: true,

                questions: {
                    orderBy: {
                        orderIndex: 'asc',
                    },

                    select: {
                        id: true,
                        text: true,
                        questionType: true,
                        points: true,
                        orderIndex: true,

                        options: {
                            orderBy: {
                                orderIndex: 'asc',
                            },

                            select: {
                                id: true,
                                text: true,
                                orderIndex: true,
                            },
                        },
                    },
                },
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.visibility === 'private') {
            throw new ForbiddenException();
        }

        return quiz;
    }
}