import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { AiIntervention } from './ai-intervention.entity';
import { NekoAiService } from './neko-ai.service';

class FormatReviewDto {
  @IsString() @IsNotEmpty() rawSpeech: string;
  @IsString() @IsNotEmpty() storeName: string;
}

@Controller('me/ai-messages')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    @InjectRepository(AiIntervention)
    private readonly repo: Repository<AiIntervention>,
    private readonly nekoAi: NekoAiService,
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

/** 音声書き起こし→口コミ整形（写真投稿フロー用） */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiUtilController {
  constructor(private readonly nekoAi: NekoAiService) {}

  @Post('format-review')
  async formatReview(@Body() dto: FormatReviewDto) {
    const formatted = await this.nekoAi.formatReview(dto.rawSpeech, dto.storeName);
    return { formatted };
  }
}
