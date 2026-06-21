import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { DeviceLogModule } from './common/device-log/device-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { VoiceModule } from './modules/voice/voice.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { EventsModule } from './modules/events/events.module';
import { PlacesModule } from './modules/places/places.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    DeviceLogModule,
    AuthModule,
    AiModule,
    VoiceModule,
    PostsModule,
    ReactionsModule,
    EventsModule,
    PlacesModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
