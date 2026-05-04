import {
  Controller, Post, Delete, Body, Param, UseGuards,
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
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(
    @InjectRepository(Reaction) private readonly repo: Repository<Reaction>,
  ) {}

  @Post()
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
