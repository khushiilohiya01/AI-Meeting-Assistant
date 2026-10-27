import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiService } from './openai.service';
import { TranscriptionService } from './transcription.service';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [ConfigModule],
  providers: [OpenAiService, TranscriptionService, AnalysisService],
  exports: [OpenAiService, TranscriptionService, AnalysisService],
})
export class AiModule {}
