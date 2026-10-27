import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { CaptureSessionEntity } from '../database/entities/capture-session.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { CaptureService } from './capture.service';
import { CaptureGateway } from './capture.gateway';
import { AiModule } from '../ai/ai.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingEntity, CaptureSessionEntity, TranscriptSegmentEntity]),
    ConfigModule,
    AiModule,
    MeetingsModule,
  ],
  providers: [CaptureService, CaptureGateway],
  exports: [CaptureService, CaptureGateway],
})
export class CaptureModule {}
