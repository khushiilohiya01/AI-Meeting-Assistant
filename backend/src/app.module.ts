import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { MeetingsModule } from './meetings/meetings.module';
import { CaptureModule } from './capture/capture.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { CalendarModule } from './calendar/calendar.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    AiModule,
    MeetingsModule,
    CaptureModule,
    ReportsModule,
    TasksModule,
    CalendarModule,
    DashboardModule,
  ],
})
export class AppModule {}
