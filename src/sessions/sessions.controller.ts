import {
    All,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Res,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ApiExcludeEndpoint, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller('sessions')
export class SessionsController {
    constructor(
        private readonly sessionsService: SessionsService,
    ) { }
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiCreatedResponse({ description: 'Created' })
    @ApiOkResponse({ description: 'OK' })
    createSession(
        @CurrentUser() user,
        @Body() dto: CreateSessionDto,
    ) {
        return this.sessionsService.createSession(
            user.id,
            dto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/current-question')
    @ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'session ID',
        example: '123e4567-e88b-12d3-a456-426614174000',
    })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    getCurrentQuestion(
        @CurrentUser() user,
        @Param('id', new ParseUUIDPipe()) sessionId: string,
    ) {
        return this.sessionsService.getCurrentQuestionForPlayer(
            user.id,
            sessionId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/answer')
    @ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'session ID',
        example: '123e4567-e88b-12d3-a456-426614174000',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    @ApiCreatedResponse({ description: 'Created' })
    submitAnswer(
        @CurrentUser() user,
        @Param('id', new ParseUUIDPipe()) sessionId: string,
        @Body() dto: SubmitAnswerDto,
    ) {
        return this.sessionsService.submitAnswer(
            user.id,
            sessionId,
            dto,
        );
    }

    @ApiBadRequestResponse({ description: 'Bad Request' })

    @UseGuards(JwtAuthGuard)
    @Get(':id/result')
    @ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'session ID',
        example: '123e4567-e88b-12d3-a456-426614174000',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    getResult(
        @CurrentUser() user,
        @Param('id', new ParseUUIDPipe()) sessionId: string,
    ) {
        return this.sessionsService.getResult(
            user.id,
            sessionId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/leaderboard')
    @ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'session ID',
        example: '123e4567-e88b-12d3-a456-426614174000',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    getLeaderboard(
        @CurrentUser() user,
        @Param('id', new ParseUUIDPipe()) sessionId: string,
    ) {
        return this.sessionsService.getLeaderboard(
            user.id,
            sessionId,
        );
    }

    @All(':id/answer')
    @ApiExcludeEndpoint()
    handleAnswerNotAllowed(@Res() res: Response) {
        res.set('Allow', 'POST,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @All(':id/current-question')
    @ApiExcludeEndpoint()
    handleCurrentQuestionNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @All(':id/result')
    @ApiExcludeEndpoint()
    handleResultNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }

    @All(':id/leaderboard')
    @ApiExcludeEndpoint()
    handleLeaderboardNotAllowed(@Res() res: Response) {
        res.set('Allow', 'GET,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }
}