import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { QuizzesService } from './quizzes.service';

import { CreateQuizDto } from './dto/create-quiz.dto';

@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createQuiz(
    @CurrentUser() user: any,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.create(user.id, dto);
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
}