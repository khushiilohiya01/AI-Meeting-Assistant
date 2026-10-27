import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MeetingEntity } from './meeting.entity';

@Entity('capture_sessions')
export class CaptureSessionEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index()
  @Column('varchar', { length: 64 })
  meetingId: string;

  @Column('varchar', { length: 32, default: 'active' })
  status: 'active' | 'completed' | 'interrupted' | 'failed';

  @CreateDateColumn()
  startedAt: Date;

  @Column('datetime', { nullable: true })
  endedAt: Date | null;

  @Column('datetime')
  lastActivityAt: Date;

  @Column('integer', { default: 0 })
  lastSequenceNumber: number;

  @Column('text', { nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => MeetingEntity, (m) => m.captureSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: MeetingEntity;
}
