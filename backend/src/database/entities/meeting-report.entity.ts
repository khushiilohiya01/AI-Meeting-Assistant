import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MeetingEntity } from './meeting.entity';
import { TaskEntity } from './task.entity';
import { ShareLinkEntity } from './share-link.entity';

@Entity('meeting_reports')
export class MeetingReportEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index({ unique: true })
  @Column('varchar', { length: 64 })
  meetingId: string;

  @Column('text')
  summary: string;

  @Column('text')
  detailedSummary: string;

  @Column('text')
  keyTakeaways: string; // JSON string array

  @Column('text')
  topics: string; // JSON Topic[]

  @Column('text')
  decisions: string; // JSON Decision[]

  @Column('text')
  openQuestions: string; // JSON OpenQuestion[]

  @Column('text')
  hindrances: string; // JSON Hindrance[]

  @Column('text')
  followUpEvents: string; // JSON FollowUpEvent[]

  @Column('varchar', { length: 32, default: 'completed' })
  analysisStatus: 'pending' | 'completed' | 'failed' | 'partial';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => MeetingEntity, (m) => m.report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: MeetingEntity;

  @OneToMany(() => TaskEntity, (task) => task.report)
  tasks: TaskEntity[];

  @OneToMany(() => ShareLinkEntity, (share) => share.report, { cascade: true })
  shareLinks: ShareLinkEntity[];
}
