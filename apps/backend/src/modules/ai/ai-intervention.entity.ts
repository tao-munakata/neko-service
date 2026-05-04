import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

export type InterventionType = 'isolation_alert' | 'recommendation' | 'offline_proposal';

@Entity('ai_interventions')
export class AiIntervention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'intervention_type', type: 'varchar' })
  interventionType: InterventionType;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'related_post_id', type: 'uuid', nullable: true })
  relatedPostId: string | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_post_id' })
  relatedPost: Post;

  @Column({ name: 'message_text', type: 'text' })
  messageText: string;

  @CreateDateColumn({ name: 'triggered_at' })
  triggeredAt: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date | null;
}
