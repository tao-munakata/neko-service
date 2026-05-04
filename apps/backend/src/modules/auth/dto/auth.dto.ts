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
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
