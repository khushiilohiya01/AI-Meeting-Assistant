import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { MeetingEntity } from './meeting.entity';

@Entity('transcript_segments')
@Unique('UQ_meeting_sequence', ['meetingId', 'sequenceNumber'])
export class TranscriptSegmentEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index()
  @Column('varchar', { length: 64 })
  meetingId: string;

  @Column('integer')
  sequenceNumber: number;

  @Index()
  @Column('varchar', { length: 128, nullable: true })
  providerItemId: string | null;

  @Column('float', { nullable: true })
  startOffsetSeconds: number | null;

  @Column('float', { nullable: true })
  endOffsetSeconds: number | null;

  @Column('text')
  text: string;

  @Column('varchar', { length: 32, default: 'completed' })
  status: 'completed' | 'partial';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MeetingEntity, (m) => m.transcriptSegments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: MeetingEntity;
}
