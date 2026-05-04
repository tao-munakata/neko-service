import {
  Controller, Get, Post, Delete, Param, UseGuards,
  ParseUUIDPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { OfflineEvent } from './offline-event.entity';
import { OfflineEventParticipant } from './offline-event-participant.entity';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    @InjectRepository(OfflineEvent)
    private readonly eventRepo: Repository<OfflineEvent>,
    @InjectRepository(OfflineEventParticipant)
    private readonly participantRepo: Repository<OfflineEventParticipant>,
  ) {}

  @Get()
  findAll() {
    return this.eventRepo.find({
      where: { status: 'proposed' },
      order: { scheduledAt: 'ASC' },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('オフ会が見つからないにゃん');

    const participants = await this.participantRepo.find({
      where: { eventId: id },
      relations: ['user'],
    });

    return {
      ...event,
      participants: participants.map(p => ({
        userId: p.userId,
        nickname: p.user.nickname,
        avatarUrl: p.user.avatarUrl,
        joinedAt: p.joinedAt,
      })),
    };
  }

  @Post(':id/join')
  async join(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('オフ会が見つからないにゃん');

    const count = await this.participantRepo.count({ where: { eventId: id } });
    if (count >= event.capacity) {
      throw new BadRequestException('定員に達しているにゃん');
    }

    const already = await this.participantRepo.findOne({
      where: { eventId: id, userId: user.id },
    });
    if (already) throw new BadRequestException('既に参加申込済みにゃん');

    const participant = this.participantRepo.create({ eventId: id, userId: user.id });
    return this.participantRepo.save(participant);
  }

  @Delete(':id/join')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.participantRepo.delete({ eventId: id, userId: user.id });
  }
}
