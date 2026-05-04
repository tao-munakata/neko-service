import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NekoAiService } from '../ai/neko-ai.service';

class ConvertDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly nekoAi: NekoAiService) {}

  // ネコ語変換（テキスト → ネコ語）
  @Post('neko-convert')
  async convert(@Body() dto: ConvertDto) {
    const nekoText = await this.nekoAi.convertToNekoText(dto.text);
    return { rawText: dto.text, nekoText };
  }
}
