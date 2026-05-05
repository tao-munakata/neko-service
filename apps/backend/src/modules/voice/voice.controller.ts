import {
  Controller, Post, Body, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, Get, Param, NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NekoAiService } from '../ai/neko-ai.service';
import { VoiceService } from './voice.service';

class ConvertDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly nekoAi: NekoAiService,
    private readonly voiceService: VoiceService,
  ) {}

  @Post('neko-convert')
  @UseGuards(JwtAuthGuard)
  async convert(@Body() dto: ConvertDto) {
    const nekoText = await this.nekoAi.convertToNekoText(dto.text);
    return { rawText: dto.text, nekoText };
  }

  /** 声ファイルのアップロード（登録フロー・認証不要） */
  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadVoice(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('voiceGender') voiceGender: string,
  ) {
    if (!file) throw new BadRequestException('音声ファイルがないにゃん');
    if (!userId) throw new BadRequestException('userIdがないにゃん');

    const gender = ['male', 'female'].includes(voiceGender) ? voiceGender : 'unknown';
    const voiceUrl = await this.voiceService.uploadVoice(
      userId,
      file.buffer,
      file.mimetype,
      gender,
    );
    return {
      ok: true,
      voiceUrl,
      voiceGender: gender,
      nekoMessage: 'ありがとうにゃん！その声、ちゃんと覚えたにゃん！',
    };
  }

  /** 声の再生用プリサインドURL取得（認証必要） */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getVoiceUrl(@Param('userId') userId: string) {
    const url = await this.voiceService.getPresignedUrl(userId);
    if (!url) throw new NotFoundException('まだ声を登録していないにゃん');
    return { presignedUrl: url };
  }
}
