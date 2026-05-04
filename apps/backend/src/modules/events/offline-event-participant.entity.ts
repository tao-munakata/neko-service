import {
  Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { OfflineEvent } from './offline-event.entity';
import { User } from '../users/user.entity';

@Entity('offline_event_participants')
export class OfflineEventParticipant {
  @PrimaryColumn({ name: 'event_id' })
  eventId: string;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => OfflineEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: OfflineEvent;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
