import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { User } from '../users/user.entity';
import { DeviceRegisterDto, DeviceLoginDto, ProfileUpdateDto } from './dto/auth.dto';

const CAT_TYPES = ['サバトラ', 'トラ', 'キジトラ', 'シロ', 'クロ', 'ハチワレ', 'サビ', 'ミケ', 'チャトラ', 'アオ'];
const CAT_NAMES = ['ニャンタ', 'キジろう', 'シロミ', 'くろすけ', 'ハナ', 'サクラ', 'モモ', 'ソラ', 'ユキ', 'コテツ', 'ゴンべ', 'タマ'];

@Injectable()
export class AuthService {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: config.get<string>('anthropic.apiKey') });
  }

  async register(dto: DeviceRegisterDto) {
    const existing = await this.userRepo.findOne({ where: { deviceFingerprint: dto.deviceId } });
    if (existing) {
      await this.userRepo.update(existing.id, { lastActiveAt: new Date() });
      return {
        status: 'already_registered' as const,
        ...this.issueTokens(existing),
        user: this.toPublic(existing),
      };
    }

    const catCharacter = await this.generateCatCharacter(dto.userAgent ?? '');
    const user = this.userRepo.create({
      nickname: catCharacter,
      catCharacter,
      deviceFingerprint: dto.deviceId,
    });
    await this.userRepo.save(user);

    return {
      status: 'ok' as const,
      ...this.issueTokens(user),
      user: this.toPublic(user),
    };
  }

  async deviceLogin(dto: DeviceLoginDto) {
    const user = await this.userRepo.findOne({ where: { deviceFingerprint: dto.deviceId } });
    if (!user) throw new UnauthorizedException('このデバイスは登録されていないにゃん');
    await this.userRepo.update(user.id, { lastActiveAt: new Date() });
    return {
      status: 'ok' as const,
      ...this.issueTokens(user),
      user: this.toPublic(user),
    };
  }

  async updateProfile(userId: string, dto: ProfileUpdateDto) {
    await this.userRepo.update(userId, {
      locationLat: dto.lat ?? undefined,
      locationLng: dto.lng ?? undefined,
      mapsConsent: dto.mapsConsent,
      lastActiveAt: new Date(),
    });
    return { ok: true };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get('jwt.secret') + '_refresh',
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('トークンが無効にゃん、再ログインしてほしいにゃん');
    }
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, nickname: user.nickname };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.config.get('jwt.accessExpiry'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.config.get('jwt.refreshExpiry'),
        secret: this.config.get('jwt.secret') + '_refresh',
      }),
    };
  }

  private toPublic(user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      catCharacter: user.catCharacter,
      avatarUrl: user.avatarUrl,
    };
  }

  private async generateCatCharacter(userAgent: string): Promise<string> {
    try {
      const msg = await this.anthropic.messages.create({
        model: this.config.get<string>('anthropic.model') || 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `日本語の猫キャラクター名を1つだけ生成してください。
形式: 「猫の種類 + の + 名前」（例: サバトラのニャンタ）
猫の種類の候補: ${CAT_TYPES.join('、')}
名前の候補: ${CAT_NAMES.join('、')}
UserAgent参考: ${userAgent.slice(0, 50)}
名前だけを返してください。説明不要。`,
        }],
      });
      const content = msg.content[0];
      if (content.type === 'text') {
        const name = content.text.trim().replace(/「|」|"/g, '');
        if (name.length > 0 && name.length <= 20) return name;
      }
    } catch (e) {
      this.logger.warn('Claude API でキャラ名生成失敗、フォールバック使用', e);
    }
    const type = CAT_TYPES[Math.floor(Math.random() * CAT_TYPES.length)];
    const name = CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)];
    return `${type}の${name}`;
  }
}
