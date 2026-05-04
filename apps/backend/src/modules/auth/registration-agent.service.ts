import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { User } from '../users/user.entity';

// ── A2A 統一レスポンス型 ────────────────────────────────────────
export interface AgentStepResponse {
  step: 1 | 2 | 3 | 4;
  status: 'ok' | 'error' | 'already_registered';
  data: Record<string, unknown>;
  nekoMessage: string;       // ネコAIの発話
  nextAction: string;        // 次に何をすべきか（A2A連携用）
  accessToken?: string;
  refreshToken?: string;
}

// 猫キャラクター生成用定数
const CAT_TYPES = ['サバトラ', 'トラ', 'キジトラ', 'シロ', 'クロ', 'ハチワレ', 'サビ', 'ミケ', 'チャトラ', 'アオ'];
const CAT_NAMES = ['ニャンタ', 'キジろう', 'シロミ', 'くろすけ', 'ハナ', 'サクラ', 'モモ', 'ソラ', 'ユキ', 'コテツ', 'ゴンべ', 'タマ'];
const CAT_EMOJIS: Record<string, string> = {
  'サバトラ': '🐱', 'トラ': '🐯', 'キジトラ': '🐈', 'シロ': '🤍',
  'クロ': '🖤', 'ハチワレ': '🐈‍⬛', 'サビ': '🍂', 'ミケ': '🌈',
  'チャトラ': '🧡', 'アオ': '💙',
};

@Injectable()
export class RegistrationAgentService {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(RegistrationAgentService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: config.get<string>('anthropic.apiKey') });
  }

  // ── STEP 1: デバイス初期化・キャラ名生成 ────────────────────
  async initStep(deviceFingerprint: string, userAgent: string): Promise<AgentStepResponse> {
    // 既登録デバイスならサイレントログイン
    const existing = await this.userRepo.findOne({ where: { deviceFingerprint } });
    if (existing) {
      const tokens = this.issueTokens(existing);
      await this.userRepo.update(existing.id, { lastActiveAt: new Date() });
      return {
        step: 1,
        status: 'already_registered',
        data: { userId: existing.id, catCharacter: existing.catCharacter, nickname: existing.nickname },
        nekoMessage: `おかえりにゃん！${existing.catCharacter ?? existing.nickname}さん、また来てくれたにゃん！`,
        nextAction: 'complete',
        ...tokens,
      };
    }

    // 新規：猫キャラ名を生成
    const catCharacter = await this.generateCatCharacter(userAgent);
    const nickname = catCharacter; // ニックネーム = キャラ名

    // 仮ユーザー作成（voice/location 完了で本登録扱い）
    const user = this.userRepo.create({
      nickname,
      catCharacter,
      deviceFingerprint,
      authMethod: 'device',
    });
    await this.userRepo.save(user);

    // 仮トークン（short-lived、step2・3の認証用）
    const tempToken = this.jwtService.sign(
      { sub: user.id, step: 1 },
      { expiresIn: '10m' },
    );

    return {
      step: 1,
      status: 'ok',
      data: { userId: user.id, catCharacter, nickname, tempToken },
      nekoMessage: `こんにちはにゃん！今日から君は「${catCharacter}」だにゃん！この名前を覚えておいてほしいにゃん！`,
      nextAction: 'voice_registration',
    };
  }

  // ── STEP 2: 音声登録 ────────────────────────────────────────
  async voiceStep(userId: string, voiceRegistered: boolean): Promise<AgentStepResponse> {
    await this.userRepo.update(userId, { voiceRegistered });
    return {
      step: 2,
      status: 'ok',
      data: { voiceRegistered },
      nekoMessage: 'ありがとうにゃん！その声、ちゃんと覚えたにゃん！',
      nextAction: 'location_consent',
    };
  }

  // ── STEP 3: 位置情報 + Google Maps 同意 → JWT発行（登録完了）─
  async locationStep(
    userId: string,
    lat: number | null,
    lng: number | null,
    locationConsent: boolean,
    mapsConsent: boolean,
  ): Promise<AgentStepResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    await this.userRepo.update(userId, {
      locationLat: lat ?? undefined,
      locationLng: lng ?? undefined,
      mapsConsent,
      lastActiveAt: new Date(),
    });

    const updatedUser = { ...user, locationLat: lat, locationLng: lng, mapsConsent };
    const tokens = this.issueTokens(updatedUser as User);

    const mapsMsg = mapsConsent
      ? '投稿した場所はみんなの地図に載せるにゃん！'
      : '場所の共有は後からでも変えられるにゃん！';

    return {
      step: 3,
      status: 'ok',
      data: { userId, mapsConsent, locationConsent },
      nekoMessage: `場所を教えてくれてありがとうにゃん！${mapsMsg}`,
      nextAction: 'complete',
      ...tokens,
    };
  }

  // ── サイレントログイン（既知デバイス） ──────────────────────
  async deviceLogin(deviceFingerprint: string): Promise<AgentStepResponse> {
    const user = await this.userRepo.findOne({ where: { deviceFingerprint } });
    if (!user) throw new UnauthorizedException('このデバイスは登録されていないにゃん');
    await this.userRepo.update(user.id, { lastActiveAt: new Date() });
    const tokens = this.issueTokens(user);
    return {
      step: 4,
      status: 'ok',
      data: { userId: user.id, catCharacter: user.catCharacter, nickname: user.nickname },
      nekoMessage: `${user.catCharacter ?? user.nickname}さん、おかえりにゃん！`,
      nextAction: 'complete',
      ...tokens,
    };
  }

  // ── 猫キャラ名生成（Claude API） ─────────────────────────────
  private async generateCatCharacter(userAgent: string): Promise<string> {
    try {
      const msg = await this.anthropic.messages.create({
        model: this.config.get<string>('anthropic.model') || 'claude-opus-4-7',
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
    // フォールバック: ランダム組み合わせ
    const type = CAT_TYPES[Math.floor(Math.random() * CAT_TYPES.length)];
    const name = CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)];
    return `${type}の${name}`;
  }

  // ── JWT 発行 ─────────────────────────────────────────────────
  private issueTokens(user: User) {
    const payload = { sub: user.id, nickname: user.nickname, authMethod: user.authMethod };
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
}
