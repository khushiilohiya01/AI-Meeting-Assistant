import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { CaptureSessionEntity } from './capture-session.entity';
import { TranscriptSegmentEntity } from './transcript-segment.entity';
import { MeetingReportEntity } from './meeting-report.entity';
import { TaskEntity } from './task.entity';
import { TopicOccurrenceEntity } from './topic-occurrence.entity';

export type MeetingStatus =
  | 'created'
  | 'scheduled'
  | 'capturing'
  | 'finalizing'
  | 'analyzing'
  | 'processed'
  | 'failed'
  | 'partial';

@Entity('meetings')
export class MeetingEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 64, default: 'Google Meet' })
  platform: string;

  @Index()
  @Column('varchar', { length: 32, default: 'scheduled' })
  status: MeetingStatus;

  @Index()
  @Column('varchar', { length: 16 })
  date: string; // YYYY-MM-DD

  @Column('varchar', { length: 32, default: '10:00 AM' })
  startTime: string;

  @Column('datetime', { nullable: true })
  startTimeUtc: Date | null;

  @Column('datetime', { nullable: true })
  endTimeUtc: Date | null;

  @Column('integer', { default: 0 })
  durationSeconds: number;

  @Column('varchar', { length: 500, nullable: true })
  joinUrl: string | null;

  @Column('text', { nullable: true })
  agenda: string | null; // JSON string array

  @Column('text', { nullable: true })
  notes: string | null;

  @Column('text', { nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CaptureSessionEntity, (s) => s.meeting, { cascade: true })
  captureSessions: CaptureSessionEntity[];

  @OneToMany(() => TranscriptSegmentEntity, (t) => t.meeting, { cascade: true })
  transcriptSegments: TranscriptSegmentEntity[];

  @OneToOne(() => MeetingReportEntity, (r) => r.meeting)
  report: MeetingReportEntity | null;

  @OneToMany(() => TaskEntity, (task) => task.meeting, { cascade: true })
  tasks: TaskEntity[];

  @OneToMany(() => TopicOccurrenceEntity, (occ) => occ.meeting, { cascade: true })
  topicOccurrences: TopicOccurrenceEntity[];
}
