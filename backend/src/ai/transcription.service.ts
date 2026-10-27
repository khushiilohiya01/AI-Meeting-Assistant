import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toFile } from 'openai';
import { OpenAiService } from './openai.service';

export interface FinalizedTranscriptSegment {
  meetingId: string;
  sequenceNumber: number;
  providerItemId: string | null;
  text: string;
  startOffsetSeconds: number | null;
  endOffsetSeconds: number | null;
}

interface ActiveTranscriptionSession {
  meetingId: string;
  isReady: boolean;
  isClosing: boolean;
  sequenceCounter: number;
  packetsForwarded: number;
  bytesReceived: number;
  lastActivityAt: Date;
  allAudioChunks: Buffer[];
  interimChunks: Buffer[];
  interimBytes: number;
  transcriptionInterval: NodeJS.Timeout | null;
  onSegment: (segment: FinalizedTranscriptSegment) => Promise<void> | void;
  onError: (error: Error) => void;
  totalTranscribedSeconds: number;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly activeSessions = new Map<string, ActiveTranscriptionSession>();

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Convert 24kHz 16-bit mono PCM buffer to standard 44-byte header WAV buffer
   */
  private pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
    header.writeUInt16LE(numChannels * 2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample

    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Start a new transcription session for a meeting
   */
  async startSession(
    meetingId: string,
    onSegment: (segment: FinalizedTranscriptSegment) => Promise<void> | void,
    onError: (error: Error) => void,
  ): Promise<void> {
    if (this.activeSessions.has(meetingId)) {
      this.logger.warn(`Active session already exists for meeting ${meetingId}. Reattaching.`);
      return;
    }

    const session: ActiveTranscriptionSession = {
      meetingId,
      isReady: true,
      isClosing: false,
      sequenceCounter: 0,
      packetsForwarded: 0,
      bytesReceived: 0,
      lastActivityAt: new Date(),
      allAudioChunks: [],
      interimChunks: [],
      interimBytes: 0,
      transcriptionInterval: null,
      onSegment,
      onError,
      totalTranscribedSeconds: 0,
    };

    this.activeSessions.set(meetingId, session);
    this.logger.log(`Initialized speech transcription session for meeting ${meetingId}`);

    // Set up periodic interim transcription every 12 seconds
    session.transcriptionInterval = setInterval(async () => {
      await this.processInterimBuffer(meetingId);
    }, 12000);
  }

  /**
   * Feed a 24kHz mono PCM16 audio chunk from browser to buffer
   */
  appendAudio(meetingId: string, pcmBuffer: Buffer): void {
    const session = this.activeSessions.get(meetingId);
    if (!session || session.isClosing) {
      return;
    }

    session.lastActivityAt = new Date();
    session.bytesReceived += pcmBuffer.length;
    session.packetsForwarded += 1;
    session.allAudioChunks.push(pcmBuffer);
    session.interimChunks.push(pcmBuffer);
    session.interimBytes += pcmBuffer.length;
  }

  /**
   * Transcribe accumulated interim audio buffer in background
   */
  private async processInterimBuffer(meetingId: string): Promise<void> {
    const session = this.activeSessions.get(meetingId);
    if (!session || session.isClosing) return;

    // Minimum 4 seconds of audio (24000 samples/sec * 2 bytes/sample * 4 sec = 192,000 bytes)
    if (session.interimBytes < 192000) return;

    const chunksToProcess = [...session.interimChunks];
    session.interimChunks = [];
    session.interimBytes = 0;

    const pcmData = Buffer.concat(chunksToProcess);
    await this.transcribeAndEmit(session, pcmData);
  }

  /**
   * Send PCM audio to OpenAI Whisper-1 and emit structured segments
   */
  private async transcribeAndEmit(
    session: ActiveTranscriptionSession,
    pcmData: Buffer,
  ): Promise<void> {
    if (!this.openAiService.isConfigured()) {
      this.logger.warn(`OpenAI not configured. Skipping Whisper transcription for ${session.meetingId}`);
      return;
    }

    // Minimum 0.5s of audio (24,000 bytes)
    if (pcmData.length < 24000) return;

    try {
      const client = this.openAiService.getClient();
      const model = this.openAiService.getTranscriptionModel() || 'whisper-1';
      const wavBuffer = this.pcmToWav(pcmData, 24000, 1);
      const audioFile = await toFile(wavBuffer, `meeting_${session.meetingId}.wav`, {
        type: 'audio/wav',
      });

      this.logger.log(
        `Transcribing ${(pcmData.length / 48000).toFixed(1)}s of audio via OpenAI ${model} for meeting ${session.meetingId}...`,
      );

      const response: any = await client.audio.transcriptions.create({
        file: audioFile,
        model: model,
        response_format: 'verbose_json',
      });

      const startBase = session.totalTranscribedSeconds;
      const duration = response.duration || pcmData.length / 48000;
      session.totalTranscribedSeconds += duration;

      if (Array.isArray(response.segments) && response.segments.length > 0) {
        for (const seg of response.segments) {
          const text = (seg.text || '').trim();
          // Filter out empty or common hallucination artifacts from silence
          if (text && !this.isSilenceArtifact(text, seg.no_speech_prob)) {
            session.sequenceCounter += 1;
            await session.onSegment({
              meetingId: session.meetingId,
              sequenceNumber: session.sequenceCounter,
              providerItemId: `whisper-${seg.id ?? session.sequenceCounter}`,
              text: text,
              startOffsetSeconds: Math.round((startBase + (seg.start || 0)) * 10) / 10,
              endOffsetSeconds: Math.round((startBase + (seg.end || duration)) * 10) / 10,
            });
          }
        }
      } else if (response.text && response.text.trim()) {
        const text = response.text.trim();
        if (!this.isSilenceArtifact(text)) {
          session.sequenceCounter += 1;
          await session.onSegment({
            meetingId: session.meetingId,
            sequenceNumber: session.sequenceCounter,
            providerItemId: `whisper-${session.sequenceCounter}`,
            text: text,
            startOffsetSeconds: Math.round(startBase * 10) / 10,
            endOffsetSeconds: Math.round((startBase + duration) * 10) / 10,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`OpenAI Whisper transcription failed for meeting ${session.meetingId}: ${err.message}`);
      session.onError(err);
    }
  }

  /**
   * Filter out hallucination tokens when Whisper transcribes low-volume background noise or pure silence
   */
  private isSilenceArtifact(text: string, noSpeechProb?: number): boolean {
    if (noSpeechProb !== undefined && noSpeechProb > 0.85) {
      return true;
    }
    const lower = text.toLowerCase().trim();
    const commonArtifacts = [
      'you',
      'thank you.',
      'thanks for watching!',
      'subscribe',
      'subtitles by the amara.org community',
      'beep',
      '.',
      '...',
    ];
    return commonArtifacts.includes(lower);
  }

  /**
   * Finalize session: transcribe any remaining audio and flush complete meeting recording
   */
  async finalizeSession(meetingId: string): Promise<void> {
    const session = this.activeSessions.get(meetingId);
    if (!session) return;

    session.isClosing = true;

    if (session.transcriptionInterval) {
      clearInterval(session.transcriptionInterval);
      session.transcriptionInterval = null;
    }

    try {
      // If no segments were emitted yet during the session, transcribe the ENTIRE recording buffer in one pass
      if (session.sequenceCounter === 0 && session.allAudioChunks.length > 0) {
        const fullPcm = Buffer.concat(session.allAudioChunks);
        this.logger.log(
          `Finalizing meeting ${meetingId}: transcribing entire recording buffer (${(fullPcm.length / 48000).toFixed(1)}s)...`,
        );
        session.totalTranscribedSeconds = 0;
        await this.transcribeAndEmit(session, fullPcm);
      } else if (session.interimChunks.length > 0) {
        // Transcribe remaining tail buffer
        const remainingPcm = Buffer.concat(session.interimChunks);
        session.interimChunks = [];
        session.interimBytes = 0;
        await this.transcribeAndEmit(session, remainingPcm);
      }
    } catch (err: any) {
      this.logger.error(`Error during finalize transcription for ${meetingId}: ${err.message}`);
    } finally {
      this.activeSessions.delete(meetingId);
      this.logger.log(
        `Finalized transcription session for meeting ${meetingId}. Generated ${session.sequenceCounter} speech segments.`,
      );
    }
  }

  getSessionStats(meetingId: string) {
    const session = this.activeSessions.get(meetingId);
    if (!session) return null;
    return {
      meetingId: session.meetingId,
      isReady: session.isReady,
      packetsForwarded: session.packetsForwarded,
      bytesReceived: session.bytesReceived,
      lastActivityAt: session.lastActivityAt,
      sequenceCounter: session.sequenceCounter,
    };
  }
}
