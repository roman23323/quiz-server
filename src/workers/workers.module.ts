import { Module, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';

import { SessionsService } from '../sessions/sessions.service';
import { SessionsGateway } from '../sessions/sessions.gateway';
import { SessionsModule } from '../sessions/sessions.module';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [SessionsModule]
})
export class WorkersModule implements OnModuleInit {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly gateway: SessionsGateway,
        private readonly configService: ConfigService
    ) { }

    onModuleInit() {
        const worker = new Worker(
            'session-queue',
            async (job) => {
                const { sessionId } = job.data;

                const result =
                    await this.sessionsService.advanceSessionQuestion(
                        sessionId,
                    );

                if (result.finished) {
                    this.gateway.server
                        .to(sessionId)
                        .emit('session:finished');
                    return;
                }

                const question =
                    await this.sessionsService.getCurrentQuestionForSession(
                        sessionId,
                    );

                this.gateway.server
                    .to(sessionId)
                    .emit('session:question', question);

                await this.sessionsService.scheduleNextQuestion(
                    sessionId,
                    question.timing.secondsPerQuestion * 1000,
                );
            },
            {
                connection: {
                    url: this.configService.get('REDIS_URL')
                }
            }
        );

        worker.on('failed', (job, err) => {
            console.error('Job failed', err);
        });
    }
}