import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceLogService } from '../../common/device-log/device-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeviceRegisterDto, DeviceLoginDto, ProfileUpdateDto, RefreshDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

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
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: DeviceRegisterDto, @Req() req: any) {
    this.deviceLog.record('registration_init', extractIp(req), {
      deviceId: dto.deviceId,
      userAgent: dto.userAgent ?? req.headers?.['user-agent'] ?? 'unknown',
      screenResolution: null,
      timezone: null,
      language: null,
    });
    return this.authService.register(dto);
  }

  @Post('device-login')
  @HttpCode(HttpStatus.OK)
  deviceLogin(@Body() dto: DeviceLoginDto, @Req() req: any) {
    this.deviceLog.record('device_login', extractIp(req), {
      deviceId: dto.deviceId,
      userAgent: req.headers?.['user-agent'] ?? 'unknown',
      screenResolution: null,
      timezone: null,
      language: null,
    });
    return this.authService.deviceLogin(dto);
  }

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() dto: ProfileUpdateDto, @CurrentUser() user: User) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
