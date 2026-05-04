import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type EventStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

@Entity('offline_events')
export class OfflineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'proposed_by', type: 'varchar', length: 10 })
  proposedBy: 'ai' | 'user';

  @Column({ name: 'venue_text', type: 'text', nullable: true })
  venueText: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({ type: 'varchar', default: 'proposed' })
  status: EventStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
