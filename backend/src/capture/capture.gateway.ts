import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CaptureService } from './capture.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class CaptureGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CaptureGateway.name);
  private socketToMeeting = new Map<string, string>();

  constructor(private readonly captureService: CaptureService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Capture client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const meetingId = this.socketToMeeting.get(client.id);
    this.logger.log(`Capture client disconnected: ${client.id} (meeting: ${meetingId || 'none'})`);
    this.socketToMeeting.delete(client.id);
  }

  @SubscribeMessage('capture:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; captureToken?: string },
  ) {
    const { meetingId } = data;
    if (!meetingId) {
      client.emit('capture:error', { message: 'meetingId is required to join capture session' });
      return;
    }

    try {
      this.logger.log(`Client ${client.id} joining capture for meeting ${meetingId}`);
      client.join(`meeting:${meetingId}`);
      this.socketToMeeting.set(client.id, meetingId);

      const session = await this.captureService.initializeSession(
        meetingId,
        (insights: any) => {
          this.server.to(`meeting:${meetingId}`).emit('insights:update', insights);
        },
        (segment: any) => {
          this.server.to(`meeting:${meetingId}`).emit('transcript:segment', segment);
        },
        (err: Error) => {
          client.emit('capture:error', { message: err.message });
        },
      );

      client.emit('capture:status', {
        status: 'capturing',
        meetingId,
        sessionId: session.sessionId,
        message: 'Capture session active. Audio streaming ready.',
      });
    } catch (err: any) {
      this.logger.error(`Failed to initialize capture session: ${err.message}`);
      client.emit('capture:error', { message: err.message });
    }
  }

  @SubscribeMessage('capture:audio')
  async handleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      meetingId: string;
      sessionId?: string;
      sequenceNumber: number;
      audio: ArrayBuffer | Buffer | string;
    },
  ) {
    const { meetingId, sessionId, sequenceNumber, audio } = data;
    if (!meetingId || audio === undefined) return;

    try {
      let pcmBuffer: Buffer;
      if (Buffer.isBuffer(audio)) {
        pcmBuffer = audio;
      } else if (audio instanceof ArrayBuffer) {
        pcmBuffer = Buffer.from(audio);
      } else if (typeof audio === 'string') {
        pcmBuffer = Buffer.from(audio, 'base64');
      } else {
        pcmBuffer = Buffer.from(audio as any);
      }

      await this.captureService.processAudioPacket({
        meetingId,
        sessionId,
        sequenceNumber: sequenceNumber || 0,
        pcmBuffer,
      });
    } catch (err: any) {
      this.logger.warn(`Error processing audio packet: ${err.message}`);
      client.emit('capture:error', { message: err.message });
    }
  }

  @SubscribeMessage('capture:stop')
  async handleStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    const { meetingId } = data;
    if (!meetingId) return;

    try {
      this.logger.log(`Received capture:stop for meeting ${meetingId}`);

      // Notify room that finalization has started
      this.server.to(`meeting:${meetingId}`).emit('meeting:finalizing', {
        meetingId,
        status: 'finalizing',
        message: 'Finalizing audio buffer and generating AI intelligence...',
      });

      const report = await this.captureService.stopAndFinalize(meetingId);

      // Notify room that report is ready
      this.server.to(`meeting:${meetingId}`).emit('meeting:ready', {
        meetingId,
        reportId: report.id,
        status: 'processed',
        message: 'Meeting intelligence synthesized and persisted successfully.',
      });
    } catch (err: any) {
      this.logger.error(`Failed to stop and finalize meeting ${meetingId}: ${err.message}`);
      client.emit('capture:error', { message: err.message });
    }
  }

  @SubscribeMessage('capture:ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    client.emit('capture:pong', { timestamp: Date.now(), received: data });
  }
}
