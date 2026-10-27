import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TopicOccurrenceEntity } from './topic-occurrence.entity';

export type TopicStatus =
  | 'new'
  | 'continuing'
  | 'recurring_unresolved'
  | 'resolved'
  | 'unclear';

@Entity('topic_memories')
export class TopicMemoryEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Index({ unique: true })
  @Column('varchar', { length: 128 })
  canonicalKey: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Index()
  @Column('varchar', { length: 32, default: 'new' })
  status: TopicStatus;

  @CreateDateColumn()
  firstSeenAt: Date;

  @Column('datetime')
  lastSeenAt: Date;

  @Column('integer', { default: 1 })
  occurrenceCount: number;

  @Column('text', { nullable: true })
  resolutionEvidence: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TopicOccurrenceEntity, (occ) => occ.topic, { cascade: true })
  occurrences: TopicOccurrenceEntity[];
}
