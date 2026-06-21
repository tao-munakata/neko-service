import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class InitRegistrationDto {
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  screenResolution?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class VoiceRegistrationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  voiceRegistered: boolean;
}

export class LocationConsentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsBoolean()
  locationConsent: boolean;

  @IsBoolean()
  mapsConsent: boolean;
}

export class DeviceLoginDto {
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;
}
