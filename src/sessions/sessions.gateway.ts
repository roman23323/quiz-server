import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
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

    client.join(data.sessionId);

    this.server
      .to(data.sessionId)
      .emit('session:joined', {
        userId: user.sub
      });
  }

  @SubscribeMessage('session:start')
  async handleStart(
    @MessageBody()
    data: { sessionId: string },
  ) {
    this.server
      .to(data.sessionId)
      .emit('session:started');
  }

  @SubscribeMessage('session:get-question')
  async sendQuestion(
    @MessageBody()
    data: { sessionId: string; userId: string },
  ) {
    const question =
      await this.sessionsService.getCurrentQuestion(
        data.userId,
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

    const result =
      await this.sessionsService.submitAnswer(
        user.sub,
        data.sessionId,
        data.dto,
      );

    this.server
      .to(data.sessionId)
      .emit('session:answer-result', {
        userId: user.sub,
        ...result,
      });

    if (!result.finished) {
      const next =
        await this.sessionsService.getCurrentQuestion(
          user.sub,
          data.sessionId,
        );

      this.server
        .to(data.sessionId)
        .emit('session:question', next);
    } else {
      this.server
        .to(data.sessionId)
        .emit('session:finished');
    }
  }

  async handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    try {
      const token =
        client.handshake.auth?.token;

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