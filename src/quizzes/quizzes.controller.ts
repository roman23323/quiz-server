import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    All,
    Res,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { QuizzesService } from './quizzes.service';
import { ApiExcludeEndpoint, ApiParam, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiOkResponse, ApiCreatedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('quizzes')
export class QuizzesController {
    constructor(private quizzesService: QuizzesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiCreatedResponse({ description: 'Created' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    createQuiz(
        @CurrentUser() user: any,
        @Body() dto: CreateQuizDto,
    ) {
        return this.quizzesService.create(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiOkResponse({ description: 'OK' })
    @Get('my')
    getMyQuizzes(@CurrentUser() user: any) {
        return this.quizzesService.findMyQuizzes(user.id);
    }

    @All('my')
    @ApiExcludeEndpoint()
    handleMyNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @Get('public')
    getPublicQuizzes() {
        return this.quizzesService.findPublicQuizzes();
    }

    @All('public')
    @ApiExcludeEndpoint()
    handlePublicNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @UseGuards(JwtAuthGuard)
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiOkResponse({ description: 'OK' })
    @Patch(':id')
    updateQuiz(
        @Param('id', new ParseUUIDPipe()) quizId: string,
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
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiOkResponse({ description: 'OK' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @Delete(':id')
    deleteQuiz(
        @CurrentUser() user: any,
        @Param('id', new ParseUUIDPipe()) quizId: string
    ) {
        return this.quizzesService.deleteQuiz(quizId, user.id, user.role);
    }

    @All(':id')
    @ApiExcludeEndpoint()
    handleQuizIdNotAllowed(@Res() res: Response) {
        res.set('Allow', 'PATCH,DELETE,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @UseGuards(JwtAuthGuard)
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiCreatedResponse({ description: 'Created' })
    @Post(':id/questions')
    createQuestion(
        @Param('id', new ParseUUIDPipe()) quizId: string,
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
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiOkResponse({ description: 'OK' })
    @Patch(':id/questions/:questionId')
    updateQuestion(
        @Param('id', new ParseUUIDPipe()) quizId: string,
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
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiOkResponse({ description: 'OK' })
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
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

    @All(':id/edit')
    @ApiExcludeEndpoint()
    handleEditNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiOkResponse({ description: 'OK' })
    @Get(':id/play')
    getQuizForPlay(
        @Param('id') quizId: string,
    ) {
        return this.quizzesService.findOneForPlay(
            quizId,
        );
    }

    @All(':id/play')
    @ApiExcludeEndpoint()
    handlePlayNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @All(':id/questions')
    @ApiExcludeEndpoint()
    handleQuestionsNotAllowed(@Res() res: Response) {
        res.set('Allow', 'POST,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @All(':id/questions/:questionId')
    @ApiExcludeEndpoint()
    handleQuestionItemNotAllowed(@Res() res: Response) {
        res.set('Allow', 'PATCH,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }
}