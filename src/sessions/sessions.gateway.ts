import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WsException,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SessionsGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly sessionsService: SessionsService,
        private readonly jwtService: JwtService
    ) { }

    @SubscribeMessage('session:join')
    async handleJoin(
        @MessageBody()
        data: { sessionId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user;

        await this.sessionsService.joinSession(
            user.sub,
            data.sessionId,
        );

        client.join(data.sessionId);


        this.server
            .to(data.sessionId)
            .emit('session:joined', {
                userId: user.sub
            });

        return {
            ok: true
        };
    }

    @SubscribeMessage('session:start')
    async handleStart(
        @MessageBody()
        data: {
            sessionId: string;
        },

        @ConnectedSocket()
        client: Socket,
    ) {
        const user = client.data.user;

        await this.sessionsService.startSession(
            user.sub,
            data.sessionId,
        );

        this.server
            .to(data.sessionId)
            .emit('session:started');

        const question =
            await this.sessionsService.getCurrentQuestionForSession(
                data.sessionId,
            );

        this.server
            .to(data.sessionId)
            .emit('session:question', question);

        await this.sessionsService.scheduleNextQuestion(
            data.sessionId,
            question.timing.secondsPerQuestion * 1000,
        );

        return {
            ok: true,
        };
    }

    @SubscribeMessage('session:get-question')
    async sendQuestion(
        @MessageBody()
        data: { sessionId: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        const user = client.data.user;

        const question =
            await this.sessionsService.getCurrentQuestionForSession(
                data.sessionId,
            );

        this.server
            .to(data.sessionId)
            .emit('session:question', question);
    }

    @SubscribeMessage('session:answer')
    async handleAnswer(
        @MessageBody()
        data: {
            sessionId: string;
            dto: any;
        },
        @ConnectedSocket() client: Socket
    ) {
        const user = client.data.user;
        console.log("HANDLE ANSWER");

        const result =
            await this.sessionsService.submitAnswer(
                user.sub,
                data.sessionId,
                data.dto,
            );

        client.emit('session:answer-result', {
            correct: result.correct,
            earnedPoints: result.earnedPoints,
        });

        this.server
            .to(data.sessionId)
            .emit('session:player-answered', {
                userId: user.sub,
            });
    }

    @SubscribeMessage('session:next-question')
    async handleNextQuestion(
        @MessageBody()
        data: {
            sessionId: string;
        },

        @ConnectedSocket()
        client: Socket,
    ) {
        const user = client.data.user;
        const session =
            await this.sessionsService.getSession(
                data.sessionId,
            );

        if (session.hostUserId !== user.sub) {
            throw new WsException(
                'Only host can advance session',
            );
        }
        const result =
            await this.sessionsService
                .advanceSessionQuestion(
                    data.sessionId,
                );
        if (result.finished) {
            this.server
                .to(data.sessionId)
                .emit('session:finished');

            return;
        }
        const question =
            await this.sessionsService
                .getCurrentQuestionForSession(
                    data.sessionId,
                );

        this.server
            .to(data.sessionId)
            .emit('session:question', question);
    }

    async handleConnection(client: Socket) {
        console.log('Client connected:', client.id);
        try {
            const token =
                client.handshake.headers?.access_token as string;

            if (!token) {
                client.disconnect();
                return;
            }

            const payload =
                await this.jwtService.verifyAsync(token);

            client.data.user = payload;

            console.log(
                'WS connected:',
                payload.sub,
            );
        } catch (error) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log('Client disconnected:', client.id);
    }
}