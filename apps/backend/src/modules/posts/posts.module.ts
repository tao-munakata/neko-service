import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { Category } from './category.entity';
import { AiModule } from '../ai/ai.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category]), AiModule, VoiceModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
