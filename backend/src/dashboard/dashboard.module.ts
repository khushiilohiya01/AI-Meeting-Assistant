import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { TopicMemoryEntity } from '../database/entities/topic-memory.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AiModule } from '../ai/ai.module';
import { ReportsModule } from '../reports/reports.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingEntity,
      TaskEntity,
      MeetingReportEntity,
      TopicMemoryEntity,
    ]),
    AiModule,
    ReportsModule,
    TasksModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
