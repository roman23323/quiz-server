import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { QuizzesService } from './quizzes.service';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('quizzes')
export class QuizzesController {
    constructor(private quizzesService: QuizzesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    createQuiz(
        @CurrentUser() user: any,
        @Body() dto: CreateQuizDto,
    ) {
        return this.quizzesService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deleteQuiz(
        @CurrentUser() user: any,
        @Param('id') quizId: string
    ) {
        return this.quizzesService.deleteQuiz(quizId, user.id, user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    getMyQuizzes(@CurrentUser() user: any) {
        return this.quizzesService.findMyQuizzes(user.id);
    }

    @Get('public')
    getPublicQuizzes() {
        return this.quizzesService.findPublicQuizzes();
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateQuiz(
        @Param('id') quizId: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateQuizDto
    ) {
        return this.quizzesService.update(
            quizId,
            user.id,
            user.role,
            dto
        )
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/questions')
    createQuestion(
        @Param('id') quizId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateQuestionDto,
    ) {
        return this.quizzesService.createQuestion(
            quizId,
            user.id,
            dto,
            user.role,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/questions/:questionId')
    updateQuestion(
        @Param('id') quizId: string,
        @Param('questionId') questionId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateQuestionDto,
    ) {
        dto.id = questionId;

        return this.quizzesService.updateQuestion(
            quizId,
            user.id,
            user.role,
            dto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/edit')
    getQuizForEdit(
        @Param('id') quizId: string,
        @CurrentUser() user: any,
    ) {
        return this.quizzesService.findOneForEdit(
            quizId,
            user.id,
            user.role,
        );
    }

    @Get(':id/play')
    getQuizForPlay(
        @Param('id') quizId: string,
    ) {
        return this.quizzesService.findOneForPlay(
            quizId,
        );
    }
}