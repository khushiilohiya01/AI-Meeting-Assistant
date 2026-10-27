import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { MeetingEntity } from './entities/meeting.entity';
import { CaptureSessionEntity } from './entities/capture-session.entity';
import { TranscriptSegmentEntity } from './entities/transcript-segment.entity';
import { MeetingReportEntity } from './entities/meeting-report.entity';
import { TaskEntity } from './entities/task.entity';
import { TopicMemoryEntity } from './entities/topic-memory.entity';
import { TopicOccurrenceEntity } from './entities/topic-occurrence.entity';
import { ShareLinkEntity } from './entities/share-link.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbPath = config.get<string>('DATABASE_PATH', './data/meettrack.sqlite');
        const resolvedPath = path.isAbsolute(dbPath)
          ? dbPath
          : path.resolve(process.cwd(), dbPath);

        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        return {
          type: 'sqlite',
          database: resolvedPath,
          entities: [
            MeetingEntity,
            CaptureSessionEntity,
            TranscriptSegmentEntity,
            MeetingReportEntity,
            TaskEntity,
            TopicMemoryEntity,
            TopicOccurrenceEntity,
            ShareLinkEntity,
          ],
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
