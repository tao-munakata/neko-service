import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 50)
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

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

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
