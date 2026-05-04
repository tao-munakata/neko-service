import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Post } from '../modules/posts/post.entity';
import { Category } from '../modules/posts/category.entity';
import { Reaction } from '../modules/reactions/reaction.entity';
import { AiIntervention } from '../modules/ai/ai-intervention.entity';
import { OfflineEvent } from '../modules/events/offline-event.entity';
import { OfflineEventParticipant } from '../modules/events/offline-event-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        entities: [
          User,
          Post,
          Category,
          Reaction,
          AiIntervention,
          OfflineEvent,
          OfflineEventParticipant,
        ],
        synchronize: false,
        logging: config.get('nodeEnv') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
