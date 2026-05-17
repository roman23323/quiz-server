import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('sessions')
export class SessionsController {
    constructor(
        private readonly sessionsService: SessionsService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post()
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
    getCurrentQuestion(
        @CurrentUser() user,
        @Param('id') sessionId: string,
    ) {
        return this.sessionsService.getCurrentQuestion(
            user.id,
            sessionId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/answer')
    submitAnswer(
        @CurrentUser() user,
        @Param('id') sessionId: string,
        @Body() dto: SubmitAnswerDto,
    ) {
        return this.sessionsService.submitAnswer(
            user.id,
            sessionId,
            dto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/result')
    getResult(
        @CurrentUser() user,
        @Param('id') sessionId: string,
    ) {
        return this.sessionsService.getResult(
            user.id,
            sessionId,
        );
    }
}