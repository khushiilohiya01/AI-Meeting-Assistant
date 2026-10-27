import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI | null = null;
  private readonly apiKey: string;
  private readonly analysisModel: string;
  private readonly transcriptionModel: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '').trim();
    this.analysisModel = this.config.get<string>('OPENAI_ANALYSIS_MODEL', 'gpt-4o').trim();
    this.transcriptionModel = this.config
      .get<string>('OPENAI_TRANSCRIPTION_MODEL', 'whisper-1')
      .trim();

    if (this.apiKey && this.apiKey !== 'your_openai_api_key_here') {
      try {
        this.client = new OpenAI({ apiKey: this.apiKey });
        this.logger.log(`OpenAI client initialized with analysis model: ${this.analysisModel}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize OpenAI client: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'OPENAI_API_KEY is not configured or is a placeholder. OpenAI requests will return configuration guidance.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your_openai_api_key_here' && this.client);
  }

  getClient(): OpenAI {
    if (!this.client) {
      throw new Error(
        'OpenAI API key is missing or not configured in backend/.env. Please configure OPENAI_API_KEY to enable AI transcription and intelligence reports.',
      );
    }
    return this.client;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getAnalysisModel(): string {
    return this.analysisModel;
  }

  getTranscriptionModel(): string {
    return this.transcriptionModel;
  }
}
