import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MeetingReportEntity } from './meeting-report.entity';

@Entity('share_links')
export class ShareLinkEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index()
  @Column('varchar', { length: 64 })
  reportId: string;

  @Index({ unique: true })
  @Column('varchar', { length: 128 })
  tokenHash: string;

  @Column('boolean', { default: true })
  includeTranscript: boolean;

  @Column('datetime', { nullable: true })
  expiresAt: Date | null;

  @Column('datetime', { nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MeetingReportEntity, (r) => r.shareLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: MeetingReportEntity;
}
