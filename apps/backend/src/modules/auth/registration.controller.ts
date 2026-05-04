import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrationAgentService } from './registration-agent.service';
import {
  InitRegistrationDto,
  VoiceRegistrationDto,
  LocationConsentDto,
  DeviceLoginDto,
} from './dto/registration.dto';

/**
 * 新規登録フロー（A2A 対応設計）
 * 各エンドポイントは独立して呼び出し可能。
 * レスポンスは AgentStepResponse の統一 JSON 構造。
 */
@Controller('registration')
export class RegistrationController {
  constructor(private readonly agent: RegistrationAgentService) {}

  /** STEP 1: デバイス指紋送信 → キャラ名生成 or サイレントログイン */
  @Post('init')
  @HttpCode(HttpStatus.OK)
  init(@Body() dto: InitRegistrationDto) {
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
  deviceLogin(@Body() dto: DeviceLoginDto) {
    return this.agent.deviceLogin(dto.deviceFingerprint);
  }
}
