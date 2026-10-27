import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { CaptureSessionEntity } from '../database/entities/capture-session.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { TranscriptionService, FinalizedTranscriptSegment } from '../ai/transcription.service';
import { AnalysisService } from '../ai/analysis.service';
import { MeetingsService } from '../meetings/meetings.service';

@Injectable()
export class CaptureService {
  private readonly logger = new Logger(CaptureService.name);
  private recentSegmentsForInsights = new Map<string, string[]>();
  private insightsTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
    @InjectRepository(CaptureSessionEntity)
    private readonly captureSessionRepo: Repository<CaptureSessionEntity>,
    @InjectRepository(TranscriptSegmentEntity)
    private readonly transcriptRepo: Repository<TranscriptSegmentEntity>,
    private readonly transcriptionService: TranscriptionService,
    private readonly analysisService: AnalysisService,
    private readonly meetingsService: MeetingsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Initialize and attach capture session for active audio streaming
   */
  async initializeSession(
    meetingId: string,
    onInsightsUpdate?: (insights: any) => void,
    onTranscriptSegment?: (segment: FinalizedTranscriptSegment) => void,
    onError?: (err: Error) => void,
  ): Promise<{ sessionId: string; status: string }> {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId } });
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // Find active capture session or create one
    let session = await this.captureSessionRepo.findOne({
      where: { meetingId, status: 'active' },
      order: { startedAt: 'DESC' },
    });

    if (!session) {
      session = this.captureSessionRepo.create({
        id: `cs-${uuidv4()}`,
        meetingId,
        status: 'active',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        lastSequenceNumber: 0,
        errorMessage: null,
      });
      session = await this.captureSessionRepo.save(session);
    }

    meeting.status = 'capturing';
    meeting.startTimeUtc = meeting.startTimeUtc || new Date();
    await this.meetingRepo.save(meeting);

    this.recentSegmentsForInsights.set(meetingId, []);

    // Start OpenAI speech transcription upstream connection
    await this.transcriptionService.startSession(
      meetingId,
      async (segment: FinalizedTranscriptSegment) => {
        await this.handleFinalizedSegment(segment);
        if (onTranscriptSegment) {
          onTranscriptSegment(segment);
        }
      },
      (err: Error) => {
        this.logger.error(`Transcription session error for ${meetingId}: ${err.message}`);
        if (onError) onError(err);
      },
    );

    // Setup periodic incremental live insights if enabled
    const liveInsightsEnabled = this.config.get<string>('LIVE_INSIGHTS_ENABLED', 'true') === 'true';
    const intervalSecs = parseInt(
      this.config.get<string>('LIVE_INSIGHTS_INTERVAL_SECONDS', '60'),
      10,
    );

    if (liveInsightsEnabled && onInsightsUpdate) {
      if (this.insightsTimers.has(meetingId)) {
        clearInterval(this.insightsTimers.get(meetingId)!);
      }

      const timer = setInterval(async () => {
        try {
          const buffer = this.recentSegmentsForInsights.get(meetingId) || [];
          if (buffer.length > 0) {
            const recentText = buffer.join('\n');
            const insights = await this.analysisService.generateIncrementalInsights(recentText);
            if (insights) {
              onInsightsUpdate(insights);
            }
          }
        } catch (err: any) {
          this.logger.warn(`Live insights interval error: ${err.message}`);
        }
      }, intervalSecs * 1000);

      this.insightsTimers.set(meetingId, timer);
    }

    return { sessionId: session.id, status: 'capturing' };
  }

  /**
   * Process incoming PCM16 audio packet from client
   */
  async processAudioPacket(params: {
    meetingId: string;
    sessionId?: string;
    sequenceNumber: number;
    pcmBuffer: Buffer;
  }): Promise<void> {
    const { meetingId, sequenceNumber, pcmBuffer } = params;

    // Validate max audio packet bytes
    const maxBytes = parseInt(this.config.get<string>('MAX_AUDIO_PACKET_BYTES', '65536'), 10);
    if (pcmBuffer.length > maxBytes) {
      throw new Error(`Audio packet size (${pcmBuffer.length} bytes) exceeds limit of ${maxBytes} bytes`);
    }

    // Forward binary audio directly to transcription service
    this.transcriptionService.appendAudio(meetingId, pcmBuffer);

    // Update capture session activity in background without blocking
    if (sequenceNumber % 50 === 0) {
      await this.captureSessionRepo.update(
        { meetingId, status: 'active' },
        { lastActivityAt: new Date(), lastSequenceNumber: sequenceNumber },
      );
    }
  }

  /**
   * Save finalized transcript segment into SQLite
   */
  private async handleFinalizedSegment(segment: FinalizedTranscriptSegment): Promise<void> {
    try {
      const segId = `seg-${uuidv4()}`;
      const entity = this.transcriptRepo.create({
        id: segId,
        meetingId: segment.meetingId,
        sequenceNumber: segment.sequenceNumber,
        providerItemId: segment.providerItemId,
        startOffsetSeconds: segment.startOffsetSeconds,
        endOffsetSeconds: segment.endOffsetSeconds,
        text: segment.text,
        status: 'completed',
      });

      await this.transcriptRepo.save(entity);

      // Accumulate in recent buffer for live insights
      const buffer = this.recentSegmentsForInsights.get(segment.meetingId) || [];
      buffer.push(segment.text);
      if (buffer.length > 30) buffer.shift(); // keep bounded window
      this.recentSegmentsForInsights.set(segment.meetingId, buffer);
    } catch (err: any) {
      this.logger.warn(`Failed to persist transcript segment: ${err.message}`);
    }
  }

  /**
   * Stop capture, flush audio, finalize OpenAI session, and generate final report
   */
  async stopAndFinalize(meetingId: string): Promise<any> {
    this.logger.log(`Stopping and finalizing capture for meeting ${meetingId}`);

    // Clear live insights timer
    const timer = this.insightsTimers.get(meetingId);
    if (timer) {
      clearInterval(timer);
      this.insightsTimers.delete(meetingId);
    }
    this.recentSegmentsForInsights.delete(meetingId);

    // Mark capture session completed
    await this.captureSessionRepo.update(
      { meetingId, status: 'active' },
      { status: 'completed', endedAt: new Date() },
    );

    // Finalize upstream transcription connection
    await this.transcriptionService.finalizeSession(meetingId);

    // Generate final report and persist tasks in SQLite
    const report = await this.meetingsService.finalizeAndGenerateReport(meetingId);
    return report;
  }
}
