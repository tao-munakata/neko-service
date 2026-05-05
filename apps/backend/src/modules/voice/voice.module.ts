import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { AiModule } from '../ai/ai.module';
import { User } from '../users/user.entity';

@Module({
  imports: [AiModule, TypeOrmModule.forFeature([User])],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
