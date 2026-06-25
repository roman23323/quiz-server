import { Body, Controller, Post, UseGuards, All, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiExcludeEndpoint, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiOkResponse, ApiInternalServerErrorResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @UseGuards(JwtAuthGuard)
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiServiceUnavailableResponse({ description: 'Service Unavailable' })
    @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
    @ApiOkResponse({ description: 'OK' })
    @Post('generate-quiz')
    generateQuizFromAi(
        @Body() dto: { topic?: string } | undefined,
        @CurrentUser() user) {
        const topic = dto?.topic?.trim() ?? '';
        return this.aiService.generateAndSaveQuiz(topic, user.id);
    }

    @All('generate-quiz')
    @ApiExcludeEndpoint()
    handleGenerateQuizNotAllowed(@Res() res: Response) {
        res.set('Allow', 'POST,OPTIONS');
        return res.status(405).json({ statusCode: 405, message: 'Method Not Allowed' });
    }
}
