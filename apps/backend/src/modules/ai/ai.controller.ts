import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { AiIntervention } from './ai-intervention.entity';

@Controller('me/ai-messages')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    @InjectRepository(AiIntervention)
    private readonly repo: Repository<AiIntervention>,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.repo.find({
      where: { targetUserId: user.id },
      order: { triggeredAt: 'DESC' },
      take: 50,
    });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.repo.update(
      { id, targetUserId: user.id },
      { respondedAt: new Date() },
    );
    return { ok: true };
  }
}
