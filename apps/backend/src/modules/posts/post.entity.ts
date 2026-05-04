import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from './category.entity';

export type PostType = 'question' | 'answer';
export type PostLayer = 'yorimichi' | 'tamariba';
export type PostStatus = 'active' | 'hidden' | 'deleted';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'post_type', type: 'varchar' })
  postType: PostType;

  @Column({ name: 'parent_post_id', type: 'uuid', nullable: true })
  parentPostId: string | null;

  @Column({ name: 'raw_text', type: 'text', nullable: true })
  rawText: string | null;

  @Column({ name: 'neko_text', type: 'text' })
  nekoText: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'varchar', default: 'yorimichi' })
  layer: PostLayer;

  @Column({ name: 'location_text', type: 'varchar', length: 100, nullable: true })
  locationText: string | null;

  @Column({ type: 'varchar', default: 'active' })
  status: PostStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
