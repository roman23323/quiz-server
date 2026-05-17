import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    PrismaService,
} from '../prisma/prisma.service';

import {
    CreateSessionDto,
} from './dto/create-session.dto';

import {
    QuizVisibility,
    SessionMode,
    SessionStatus,
} from '@prisma/client';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class SessionsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createSession(
        userId: string,
        dto: CreateSessionDto,
    ) {
        if (dto.mode !== SessionMode.solo) {
            throw new BadRequestException(
                'Only solo mode is currently supported',
            );
        }

        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: dto.quizId,
            },
            include: {
                questions: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
            },
        });

        if (!quiz) {
            throw new NotFoundException(
                'Quiz not found',
            );
        }

        if (
            quiz.visibility !== QuizVisibility.public
        ) {
            throw new BadRequestException(
                'Quiz is not public',
            );
        }

        if (quiz.questions.length === 0) {
            throw new BadRequestException(
                'Quiz has no questions',
            );
        }

        const session =
            await this.prisma.quizSession.create({
                data: {
                    quizId: quiz.id,

                    hostUserId: userId,

                    mode: SessionMode.solo,

                    status: SessionStatus.active,

                    currentQuestionIndex: 0,

                    startedAt: new Date(),

                    participants: {
                        create: {
                            userId,
                        },
                    },
                },

                include: {
                    participants: true,
                },
            });

        return session;
    }

    async getCurrentQuestion(
        userId: string,
        sessionId: string,
    ) {
        const session =
            await this.prisma.quizSession.findUnique({
                where: { id: sessionId },
                include: {
                    quiz: {
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
                    },
                    participants: true,
                },
            });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const participant = session.participants.find(
            (p) => p.userId === userId,
        );

        if (!participant) {
            throw new BadRequestException(
                'You are not a participant of this session',
            );
        }

        if (session.status !== SessionStatus.active) {
            throw new BadRequestException(
                'Session is not active',
            );
        }

        const index = session.currentQuestionIndex ?? 0;

        const question =
            session.quiz.questions[index];

        if (!question) {
            throw new BadRequestException(
                'No more questions',
            );
        }

        return {
            sessionId: session.id,

            question: {
                id: question.id,
                text: question.text,
                questionType: question.questionType,
                points: question.points,
                orderIndex: question.orderIndex,

                options: question.options.map((o) => ({
                    id: o.id,
                    text: o.text,
                })),
            },

            progress: {
                current: index + 1,
                total: session.quiz.questions.length,
            },

            timing: {
                secondsPerQuestion:
                    session.quiz.secondsPerQuestion,
            },
        };
    }

    async submitAnswer(
        userId: string,
        sessionId: string,
        dto: SubmitAnswerDto,
    ) {
        const session =
            await this.prisma.quizSession.findUnique({
                where: { id: sessionId },
                include: {
                    quiz: {
                        include: {
                            questions: {
                                orderBy: {
                                    orderIndex: 'asc',
                                },
                                include: {
                                    options: true,
                                },
                            },
                        },
                    },
                    participants: {
                        include: {
                            answers: true,
                        },
                    },
                },
            });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const participant = session.participants.find(
            (p) => p.userId === userId,
        );

        if (!participant) {
            throw new BadRequestException(
                'Not a participant',
            );
        }

        if (session.status !== SessionStatus.active) {
            throw new BadRequestException(
                'Session is not active',
            );
        }

        const index = session.currentQuestionIndex ?? 0;

        const question =
            session.quiz.questions[index];

        if (!question) {
            throw new BadRequestException(
                'Question not found',
            );
        }

        if (question.id !== dto.questionId) {
            throw new BadRequestException(
                'Invalid question',
            );
        }

        const alreadyAnswered =
            participant.answers.some(
                (a) => a.questionId === question.id,
            );

        if (alreadyAnswered) {
            throw new BadRequestException(
                'Already answered',
            );
        }

        let isCorrect = false;

        if (question.questionType === 'single_choice') {
            const option =
                question.options.find(
                    (o) => o.id === dto.selectedOptionId,
                );

            if (!option) {
                throw new BadRequestException(
                    'Invalid option',
                );
            }

            isCorrect = option.isCorrect;
        }

        if (question.questionType === 'text') {
            isCorrect =
                this.normalize(dto.textAnswer ?? '') ===
                this.normalize(question.correctAnswer ?? '');
        }

        const earnedPoints = isCorrect
            ? question.points
            : 0;

        await this.prisma.participantAnswer.create({
            data: {
                participantId: participant.id,
                questionId: question.id,
                selectedOptionId:
                    dto.selectedOptionId ?? null,
                textAnswer: dto.textAnswer ?? null,
                isCorrect,
                earnedPoints,
                responseTimeMs: dto.responseTimeMs,
            },
        });

        await this.prisma.sessionParticipant.update({
            where: { id: participant.id },
            data: {
                finalScore: {
                    increment: earnedPoints,
                },
            },
        });

        const isLastQuestion =
            index >= session.quiz.questions.length - 1;

        if (!isLastQuestion) {
            await this.prisma.quizSession.update({
                where: { id: sessionId },
                data: {
                    currentQuestionIndex: {
                        increment: 1,
                    },
                },
            });

            return {
                correct: isCorrect,
                earnedPoints,
                next: true,
            };
        }
        await this.prisma.quizSession.update({
            where: { id: sessionId },
            data: {
                status: SessionStatus.finished,
                endedAt: new Date(),
            },
        });

        await this.prisma.sessionParticipant.update({
            where: { id: participant.id },
            data: {
                finishedAt: new Date(),
            },
        });

        const timeMs =
            participant.finishedAt && session.startedAt
                ? participant.finishedAt.getTime() -
                session.startedAt.getTime()
                : null;

        await this.updateLeaderboard(
            userId,
            session.quizId,
            participant.finalScore + earnedPoints,
            timeMs,
        );

        return {
            correct: isCorrect,
            earnedPoints,
            finished: true,
        };
    }

    async getResult(
        userId: string,
        sessionId: string,
    ) {
        const session =
            await this.prisma.quizSession.findUnique({
                where: { id: sessionId },
                include: {
                    quiz: {
                        include: {
                            questions: {
                                include: {
                                    options: true,
                                },
                            },
                        },
                    },
                    participants: {
                        where: {
                            userId,
                        },
                        include: {
                            answers: {
                                include: {
                                    question: true,
                                    selectedOption: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const participant = session.participants[0];

        if (!participant) {
            throw new BadRequestException(
                'Not a participant',
            );
        }

        const answers = participant.answers;

        const correctCount = answers.filter(
            (a) => a.isCorrect,
        ).length;

        const totalQuestions =
            session.quiz.questions.length;

        const score = participant.finalScore;

        const timeSpent =
            participant.finishedAt && session.startedAt
                ? participant.finishedAt.getTime() -
                session.startedAt.getTime()
                : null;

        const breakdown = answers.map((a) => ({
            questionId: a.questionId,
            questionText: a.question.text,
            selectedOption:
                a.selectedOption?.text ?? a.textAnswer,
            isCorrect: a.isCorrect,
            earnedPoints: a.earnedPoints,
            responseTimeMs: a.responseTimeMs,
        }));

        return {
            sessionId: session.id,

            quiz: {
                id: session.quiz.id,
                title: session.quiz.title,
            },

            result: {
                score,
                correctCount,
                totalQuestions,
                accuracy:
                    totalQuestions > 0
                        ? correctCount / totalQuestions
                        : 0,
                timeSpentMs: timeSpent,
            },

            breakdown,
        };
    }

    private async updateLeaderboard(
        userId: string,
        quizId: string,
        score: number,
        timeMs: number | null,
    ) {
        const existing =
            await this.prisma.quizLeaderboard.findUnique({
                where: {
                    quizId_userId: {
                        quizId,
                        userId,
                    },
                },
            });

        if (!existing) {
            return this.prisma.quizLeaderboard.create({
                data: {
                    quizId,
                    userId,
                    bestScore: score,
                    bestTimeMs: timeMs ?? null,
                    attemptsCount: 1,
                },
            });
        }

        const isBetterScore =
            score > existing.bestScore;

        const isSameScoreBetterTime =
            score === existing.bestScore &&
            timeMs !== null &&
            (existing.bestTimeMs === null ||
                timeMs < existing.bestTimeMs);

        return this.prisma.quizLeaderboard.update({
            where: {
                quizId_userId: {
                    quizId,
                    userId,
                },
            },
            data: {
                attemptsCount: {
                    increment: 1,
                },

                bestScore: isBetterScore
                    ? score
                    : existing.bestScore,

                bestTimeMs: isSameScoreBetterTime
                    ? timeMs
                    : existing.bestTimeMs,
            },
        });
    }

    private normalize(str: string) {
        return str
            .trim()
            .toLowerCase();
    }
}