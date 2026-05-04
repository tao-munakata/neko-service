import {
  Injectable, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('このメールアドレスは既に登録されているにゃん');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      nickname: dto.nickname,
      email: dto.email,
      password: hashed,
    });
    await this.userRepo.save(user);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'nickname', 'email', 'membershipTier', 'password',
               'avatarUrl', 'createdAt', 'lastActiveAt'],
    });
    if (!user) throw new UnauthorizedException('メールアドレスまたはパスワードが違うにゃん');

    const valid = await bcrypt.compare(dto.password, user.password!);
    if (!valid) throw new UnauthorizedException('メールアドレスまたはパスワードが違うにゃん');

    await this.userRepo.update(user.id, { lastActiveAt: new Date() });
    return this.issueTokens(user);
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.accessExpiry'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.refreshExpiry'),
      secret: this.config.get('jwt.secret') + '_refresh',
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        membershipTier: user.membershipTier,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token, {
        secret: this.config.get('jwt.secret') + '_refresh',
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('トークンが無効にゃん、再ログインしてほしいにゃん');
    }
  }
}
