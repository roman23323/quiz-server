import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @UseGuards(JwtAuthGuard)
    @Post('generate-quiz')
    generateQuizFromAi(
        @Body() dto: { topic: string },
        @CurrentUser() user) {
        return this.aiService.generateAndSaveQuiz(dto.topic, user.id);
    }
}
