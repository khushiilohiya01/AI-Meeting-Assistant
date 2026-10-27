import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TopicMemoryEntity } from './topic-memory.entity';
import { MeetingEntity } from './meeting.entity';

@Entity('topic_occurrences')
export class TopicOccurrenceEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index()
  @Column('varchar', { length: 64 })
  topicId: string;

  @Index()
  @Column('varchar', { length: 64 })
  meetingId: string;

  @Column('text', { nullable: true })
  evidence: string | null;

  @Column('varchar', { length: 64, nullable: true })
  meetingStatus: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => TopicMemoryEntity, (t) => t.occurrences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: TopicMemoryEntity;

  @ManyToOne(() => MeetingEntity, (m) => m.topicOccurrences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: MeetingEntity;
}
