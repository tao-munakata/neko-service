import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [VoiceController],
})
export class VoiceModule {}
