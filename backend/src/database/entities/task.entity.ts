import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MeetingEntity } from './meeting.entity';
import { MeetingReportEntity } from './meeting-report.entity';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

@Entity('tasks')
export class TaskEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index()
  @Column('varchar', { length: 64 })
  meetingId: string;

  @Index()
  @Column('varchar', { length: 64, nullable: true })
  reportId: string | null;

  @Column('varchar', { length: 500 })
  title: string;

  @Column('varchar', { length: 128, nullable: true })
  assigneeName: string | null;

  @Index()
  @Column('varchar', { length: 16, nullable: true })
  dueDate: string | null; // YYYY-MM-DD

  @Column('varchar', { length: 16, default: 'medium' })
  priority: TaskPriority;

  @Index()
  @Column('varchar', { length: 16, default: 'todo' })
  status: TaskStatus;

  @Column('text', { nullable: true })
  notes: string | null;

  @Column('text', { nullable: true })
  sourceExcerpt: string | null;

  @Column('boolean', { default: false })
  needsReview: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column('varchar', { length: 32, nullable: true })
  completedAt: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => MeetingEntity, (m) => m.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: MeetingEntity;

  @ManyToOne(() => MeetingReportEntity, (r) => r.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reportId' })
  report: MeetingReportEntity | null;
}
