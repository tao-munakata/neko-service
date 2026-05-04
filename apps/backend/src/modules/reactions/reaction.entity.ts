import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique,
} from 'typeorm';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

export type ReactionType = 'thanks' | 'helpful' | 'went_there';

@Entity('reactions')
@Unique(['postId', 'userId', 'type'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  type: ReactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
