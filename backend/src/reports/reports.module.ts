import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { ShareLinkEntity } from '../database/entities/share-link.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { ReportsService } from './reports.service';
import {
  ReportsController,
  MeetingReportsController,
  PublicSharesController,
} from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingReportEntity,
      MeetingEntity,
      TranscriptSegmentEntity,
      ShareLinkEntity,
      TaskEntity,
    ]),
  ],
  controllers: [ReportsController, MeetingReportsController, PublicSharesController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
