import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NekoAiService } from './neko-ai.service';
import { AiIntervention } from './ai-intervention.entity';
import { AiController } from './ai.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiIntervention])],
  controllers: [AiController],
  providers: [NekoAiService],
  exports: [NekoAiService],
})
export class AiModule {}
