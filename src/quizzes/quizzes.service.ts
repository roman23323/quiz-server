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

    async update(
        quizId: string,
        userId: string,
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

        if (quiz.authorId !== userId) {
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

    async addQuestion(
        quizId: string,
        userId: string,
        dto: CreateQuestionDto,
    ) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.authorId !== userId) {
            throw new ForbiddenException();
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

        return this.prisma.quizQuestion.create({
            data: {
                quizId,

                text: dto.text,

                questionType: dto.questionType,

                correctAnswer: dto.correctAnswer,

                points: dto.points,

                orderIndex: dto.orderIndex,

                options: dto.options
                    ? {
                        create: dto.options.map((option) => ({
                            text: option.text,
                            isCorrect: option.isCorrect,
                            orderIndex: option.orderIndex,
                        })),
                    }
                    : undefined,
            },

            include: {
                options: true,
            },
        });
    }

    async findOneForEdit(quizId: string, userId: string) {
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

        if (quiz.authorId !== userId) {
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