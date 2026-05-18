import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { QuizzesModule } from 'src/quizzes/quizzes.module';

@Module({
  imports: [QuizzesModule],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
