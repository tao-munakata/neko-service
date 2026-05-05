import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
  ParseUUIDPipe, HttpCode, HttpStatus, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { Reaction } from './reaction.entity';
import type { ReactionType } from './reaction.entity';
import { AddReactionDto } from './dto/reaction.dto';

@Controller('posts/:postId/reactions')
export class ReactionsController {
  constructor(
    @InjectRepository(Reaction) private readonly repo: Repository<Reaction>,
  ) {}

  @Get()
  async counts(@Param('postId', ParseUUIDPipe) postId: string) {
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.postId = :postId', { postId })
      .groupBy('r.type')
      .getRawMany();
    const result: Record<string, number> = { thanks: 0, helpful: 0, went_there: 0 };
    rows.forEach(r => { result[r.type] = parseInt(r.count, 10); });
    return result;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async add(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
    @Body() dto: AddReactionDto,
  ) {
    try {
      const reaction = this.repo.create({ postId, userId: user.id, type: dto.type });
      return await this.repo.save(reaction);
    } catch {
      throw new ConflictException('既にリアクション済みにゃん');
    }
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('type') type: ReactionType,
    @CurrentUser() user: User,
  ) {
    await this.repo.delete({ postId, userId: user.id, type });
  }
}
