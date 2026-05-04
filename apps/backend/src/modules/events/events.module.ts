import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { OfflineEvent } from './offline-event.entity';
import { OfflineEventParticipant } from './offline-event-participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OfflineEvent, OfflineEventParticipant])],
  controllers: [EventsController],
})
export class EventsModule {}
