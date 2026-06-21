import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { RegistrationAgentService } from './registration-agent.service';
import { DeviceLogService } from '../../common/device-log/device-log.service';
import {
  InitRegistrationDto,
  VoiceRegistrationDto,
  LocationConsentDto,
  DeviceLoginDto,
} from './dto/registration.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIp(req: any): string {
  return (req.headers?.['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip ?? 'unknown';
}

/**
 * 新規登録フロー（A2A 対応設計）
 * 各エンドポイントは独立して呼び出し可能。
 * レスポンスは AgentStepResponse の統一 JSON 構造。
 */
@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly agent: RegistrationAgentService,
    private readonly deviceLog: DeviceLogService,
  ) {}

  /** STEP 1: デバイス指紋送信 → キャラ名生成 or サイレントログイン */
  @Post('init')
  @HttpCode(HttpStatus.OK)
  init(@Body() dto: InitRegistrationDto, @Req() req: Request) {
    this.deviceLog.record('registration_init', extractIp(req), {
      deviceId: dto.deviceFingerprint ?? null,
      userAgent: dto.userAgent ?? req.headers['user-agent'] ?? 'unknown',
      screenResolution: dto.screenResolution ?? null,
      timezone: dto.timezone ?? null,
      language: dto.language ?? null,
    });
    return this.agent.initStep(dto.deviceFingerprint, dto.userAgent ?? '');
  }

  /** STEP 2: 音声登録フラグ保存 */
  @Post('voice')
  @HttpCode(HttpStatus.OK)
  voice(@Body() dto: VoiceRegistrationDto) {
    return this.agent.voiceStep(dto.userId, dto.voiceRegistered);
  }

  /** STEP 3: 位置情報 + Google Maps 同意 → JWT 発行（登録完了） */
  @Post('location')
  @HttpCode(HttpStatus.OK)
  location(@Body() dto: LocationConsentDto) {
    return this.agent.locationStep(
      dto.userId,
      dto.lat ?? null,
      dto.lng ?? null,
      dto.locationConsent,
      dto.mapsConsent,
    );
  }

  /** サイレントログイン（既知デバイスの再訪問時） */
  @Post('device-login')
  @HttpCode(HttpStatus.OK)
  deviceLogin(@Body() dto: DeviceLoginDto, @Req() req: Request) {
    this.deviceLog.record('device_login', extractIp(req), {
      deviceId: dto.deviceFingerprint ?? null,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    return this.agent.deviceLogin(dto.deviceFingerprint);
  }
}
