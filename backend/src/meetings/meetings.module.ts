import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { CaptureSessionEntity } from '../database/entities/capture-session.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { TopicMemoryEntity } from '../database/entities/topic-memory.entity';
import { TopicOccurrenceEntity } from '../database/entities/topic-occurrence.entity';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingEntity,
      CaptureSessionEntity,
      TranscriptSegmentEntity,
      MeetingReportEntity,
      TaskEntity,
      TopicMemoryEntity,
      TopicOccurrenceEntity,
    ]),
    AiModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
