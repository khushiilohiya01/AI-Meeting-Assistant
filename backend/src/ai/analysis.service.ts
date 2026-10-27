import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import {
  MEETING_ANALYSIS_JSON_SCHEMA,
  INCREMENTAL_INSIGHTS_JSON_SCHEMA,
  MeetingAnalysisResult,
  IncrementalInsightsResult,
} from './schemas';
import {
  SYSTEM_PROMPT_FINAL_ANALYSIS,
  SYSTEM_PROMPT_INCREMENTAL_INSIGHTS,
  SYSTEM_PROMPT_TOPIC_MEMORY_RECONCILIATION,
  buildFinalAnalysisUserPrompt,
} from './prompts';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly openAiService: OpenAiService) {}

  /**
   * Synthesize full meeting transcript into structured meeting intelligence
   */
  async generateMeetingReport(params: {
    title: string;
    date: string;
    transcriptText: string;
    agenda?: string;
    notes?: string;
  }): Promise<MeetingAnalysisResult> {
    const { title, date, transcriptText, agenda, notes } = params;

    // Check if transcript is essentially empty
    if (!transcriptText || transcriptText.trim().length === 0) {
      return {
        summary: 'No spoken dialogue was detected or transcribed during this meeting session.',
        detailedSummary:
          'The audio capture session recorded no audible speech turns or the microphone/tab audio stream was silent.',
        keyTakeaways: ['No dialogue recorded during session.'],
        topics: [],
        decisions: [],
        actionItems: [],
        openQuestions: [],
        hindrances: [],
        followUpEvents: [],
      };
    }

    if (!this.openAiService.isConfigured()) {
      this.logger.warn(
        'OpenAI API key is not configured. Generating standard offline transcript summary without fabricated content.',
      );
      return {
        summary: `Meeting recorded with ${transcriptText.split('\n').length} transcribed segments. To generate AI intelligence, configure OPENAI_API_KEY in backend/.env.`,
        detailedSummary: `This meeting session captured speech dialogue. Full AI intelligence synthesis was paused because the OpenAI API key has not been provided. You can retry report generation via the reprocess endpoint at any time.`,
        keyTakeaways: [
          'Audio transcribed and stored persistently in SQLite.',
          'OpenAI API key required for full entity and action extraction.',
        ],
        topics: [
          {
            title: 'General Discussion',
            summary: 'Spoken dialogue recorded during session.',
            bullets: ['Dialogue stored in transcript table'],
            timestamp: null,
            canonicalKey: 'general_discussion',
          },
        ],
        decisions: [],
        actionItems: [],
        openQuestions: [],
        hindrances: [],
        followUpEvents: [],
      };
    }

    const client = this.openAiService.getClient();
    const model = this.openAiService.getAnalysisModel();

    try {
      this.logger.log(`Calling OpenAI Structured Outputs (${model}) for meeting report: "${title}"`);

      const userPrompt = buildFinalAnalysisUserPrompt(title, date, transcriptText, agenda, notes);

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_FINAL_ANALYSIS },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'meeting_intelligence_report',
            strict: true,
            schema: MEETING_ANALYSIS_JSON_SCHEMA,
          },
        },
      });

      const rawJson = response.choices[0]?.message?.content;
      if (!rawJson) {
        throw new Error('OpenAI returned empty response content for meeting analysis');
      }

      const parsed: MeetingAnalysisResult = JSON.parse(rawJson);
      return parsed;
    } catch (err: any) {
      this.logger.error(`OpenAI meeting analysis failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Generate incremental live insights from recent transcript window
   */
  async generateIncrementalInsights(recentTranscriptText: string): Promise<IncrementalInsightsResult | null> {
    if (!recentTranscriptText.trim() || !this.openAiService.isConfigured()) {
      return null;
    }

    const client = this.openAiService.getClient();
    const model = this.openAiService.getAnalysisModel();

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_INCREMENTAL_INSIGHTS },
          {
            role: 'user',
            content: `Recent finalized speech turns:\n\n${recentTranscriptText}\n\nExtract active telemetry.`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'incremental_live_insights',
            strict: true,
            schema: INCREMENTAL_INSIGHTS_JSON_SCHEMA,
          },
        },
      });

      const rawJson = response.choices[0]?.message?.content;
      if (!rawJson) return null;
      return JSON.parse(rawJson);
    } catch (err: any) {
      this.logger.warn(`Incremental live insights failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Reconcile current meeting findings with previous unresolved topics
   */
  async reconcileTopicMemory(params: {
    currentTopicTitle: string;
    priorTopicTitle: string;
    currentDiscussionEvidence: string;
  }): Promise<{ status: 'recurring_unresolved' | 'resolved' | 'continuing'; evidence: string }> {
    if (!this.openAiService.isConfigured()) {
      return {
        status: 'recurring_unresolved',
        evidence: params.currentDiscussionEvidence,
      };
    }

    const client = this.openAiService.getClient();
    const model = this.openAiService.getAnalysisModel();

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_TOPIC_MEMORY_RECONCILIATION },
          {
            role: 'user',
            content: `Prior Unresolved Topic: "${params.priorTopicTitle}"\nCurrent Meeting Topic: "${params.currentTopicTitle}"\nCurrent Discussion Excerpt: "${params.currentDiscussionEvidence}"\n\nClassify if this remains unresolved, is resolved, or is continuing. Respond with JSON { "status": "recurring_unresolved" | "resolved" | "continuing", "evidence": "supporting text" }.`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        status: parsed.status || 'recurring_unresolved',
        evidence: parsed.evidence || params.currentDiscussionEvidence,
      };
    } catch {
      return {
        status: 'recurring_unresolved',
        evidence: params.currentDiscussionEvidence,
      };
    }
  }
}
