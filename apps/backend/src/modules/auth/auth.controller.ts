import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceLogService } from '../../common/device-log/device-log.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIp(req: any): string {
  return (req.headers?.['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip ?? 'unknown';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceLog: DeviceLogService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: any) {
    this.deviceLog.record('email_login', extractIp(req), {
      deviceId: dto.deviceId ?? null,
      userAgent: req.headers?.['user-agent'] ?? 'unknown',
      screenResolution: dto.screenResolution ?? null,
      timezone: dto.timezone ?? null,
      language: dto.language ?? null,
    });
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
