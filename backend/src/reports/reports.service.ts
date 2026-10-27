import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { ShareLinkEntity } from '../database/entities/share-link.entity';
import { TaskEntity } from '../database/entities/task.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(MeetingReportEntity)
    private readonly reportRepo: Repository<MeetingReportEntity>,
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
    @InjectRepository(TranscriptSegmentEntity)
    private readonly transcriptRepo: Repository<TranscriptSegmentEntity>,
    @InjectRepository(ShareLinkEntity)
    private readonly shareRepo: Repository<ShareLinkEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async findAll(): Promise<any[]> {
    const reports = await this.reportRepo.find({
      relations: ['meeting', 'tasks'],
      order: { createdAt: 'DESC' },
    });

    return reports.map((r) => this.formatReportViewModel(r));
  }

  async findOne(id: string): Promise<any> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['meeting', 'tasks', 'shareLinks'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return this.formatReportViewModel(report);
  }

  async findByMeetingId(meetingId: string): Promise<any> {
    const report = await this.reportRepo.findOne({
      where: { meetingId },
      relations: ['meeting', 'tasks'],
    });

    if (!report) {
      throw new NotFoundException(`Report for meeting ${meetingId} not found`);
    }

    return this.formatReportViewModel(report);
  }

  /**
   * Get completed transcript for processed meeting.
   * Internal rule: transcript endpoint must reject active capturing meetings to preserve privacy!
   */
  async getTranscript(meetingId: string): Promise<any[]> {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId } });
    if (!meeting) {
      throw new NotFoundException(`Meeting ${meetingId} not found`);
    }

    if (meeting.status === 'capturing' || meeting.status === 'finalizing') {
      throw new ForbiddenException(
        'Transcript is protected while meeting is actively capturing or finalizing.',
      );
    }

    const segments = await this.transcriptRepo.find({
      where: { meetingId },
      order: { sequenceNumber: 'ASC' },
    });

    return segments.map((seg, idx) => {
      const minutes = Math.floor((idx * 15) / 60);
      const seconds = (idx * 15) % 60;
      const ts = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      return {
        id: seg.id,
        sequenceNumber: seg.sequenceNumber,
        speaker: {
          id: 'speaker-unassigned',
          name: 'Speaker (Dialogue)',
          email: '',
          role: 'Participant',
          initials: 'SP',
          color: '#64748B',
        },
        timestamp: ts,
        seconds: idx * 15,
        text: seg.text,
        sentiment: 'neutral',
      };
    });
  }

  /**
   * Create public share link with unguessable token and SHA-256 hash
   */
  async createShareLink(
    reportId: string,
    options?: { includeTranscript?: boolean; expiryHours?: number },
  ): Promise<{ shareId: string; publicToken: string; expiresAt: Date | null }> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const publicToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(publicToken).digest('hex');

    const expiryHours = options?.expiryHours || 168; // 7 days
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);

    const share = this.shareRepo.create({
      id: `sh-${uuidv4()}`,
      reportId: report.id,
      tokenHash,
      includeTranscript: options?.includeTranscript !== false,
      expiresAt,
      revokedAt: null,
    });

    await this.shareRepo.save(share);

    return {
      shareId: share.id,
      publicToken,
      expiresAt,
    };
  }

  async revokeShareLink(reportId: string, shareId: string): Promise<{ success: boolean }> {
    const share = await this.shareRepo.findOne({ where: { id: shareId, reportId } });
    if (!share) {
      throw new NotFoundException(`Share link not found`);
    }

    share.revokedAt = new Date();
    await this.shareRepo.save(share);
    return { success: true };
  }

  /**
   * Resolve public share token
   */
  async resolvePublicShare(token: string): Promise<any> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const share = await this.shareRepo.findOne({
      where: { tokenHash },
      relations: ['report', 'report.meeting', 'report.tasks'],
    });

    if (!share) {
      throw new NotFoundException('Share link is invalid or does not exist');
    }

    if (share.revokedAt) {
      throw new ForbiddenException('This share link has been revoked by the owner');
    }

    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      throw new ForbiddenException('This share link has expired');
    }

    const reportModel = this.formatReportViewModel(share.report);

    if (share.includeTranscript) {
      reportModel.transcript = await this.getTranscript(share.report.meetingId);
    } else {
      reportModel.transcript = [];
    }

    return {
      report: reportModel,
      shareConfig: {
        includeTranscript: share.includeTranscript,
        expiresAt: share.expiresAt,
      },
    };
  }

  /**
   * Adapter: map entity to frontend MeetingReport interface
   */
  private formatReportViewModel(report: MeetingReportEntity): any {
    const meeting = report.meeting;
    const tasks = report.tasks || [];

    const topics = this.parseJsonSafe(report.topics, []);
    const decisions = this.parseJsonSafe(report.decisions, []);
    const keyTakeaways = this.parseJsonSafe(report.keyTakeaways, []);
    const openQuestions = this.parseJsonSafe(report.openQuestions, []);
    const hindrances = this.parseJsonSafe(report.hindrances, []);
    const followUpEvents = this.parseJsonSafe(report.followUpEvents, []);

    const durationMinutes = meeting
      ? Math.round(meeting.durationSeconds / 60) || 45
      : 45;

    return {
      id: report.id,
      meetingId: report.meetingId,
      title: meeting ? meeting.title : 'Intelligence Report',
      date: meeting ? meeting.date : new Date(report.createdAt).toISOString().split('T')[0],
      startTime: meeting ? meeting.startTime : '10:00 AM',
      durationMinutes,
      platform: meeting ? meeting.platform : 'Google Meet',
      participants: [
        {
          id: 'user-self',
          name: 'Alex Vance',
          email: 'alex.vance@meettrack.ai',
          role: 'Staff Product Lead',
          initials: 'AV',
          color: '#3B82F6',
        },
      ],
      summary: report.summary,
      detailedSummary: report.detailedSummary,
      keyTakeaways,
      topics: topics.map((t: any, i: number) => ({
        id: `topic-${i}`,
        title: t.title || 'Discussion Topic',
        summary: t.summary || '',
        bullets: t.bullets || [],
        timestamp: t.timestamp || undefined,
        canonicalKey: t.canonicalKey || undefined,
      })),
      decisions: decisions.map((d: any, i: number) => ({
        id: `dec-${i}`,
        decision: d.decision || '',
        context: d.context || undefined,
        owner: d.ownerName
          ? {
              id: `p-${i}`,
              name: d.ownerName,
              email: '',
              role: 'Contributor',
              initials: d.ownerName.substring(0, 2).toUpperCase(),
              color: '#8B5CF6',
            }
          : undefined,
        timestamp: d.timestamp || undefined,
        sourceExcerpt: d.sourceExcerpt || undefined,
      })),
      actionItemIds: tasks.map((t) => t.id),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        meetingId: t.meetingId,
        meetingTitle: meeting?.title,
        reportId: t.reportId,
        assignee: {
          id: 'assignee-p',
          name: t.assigneeName || 'Unassigned',
          email: '',
          role: 'Task Owner',
          initials: (t.assigneeName || 'UN').substring(0, 2).toUpperCase(),
          color: '#10B981',
        },
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        priority: t.priority,
        status: t.status,
        notes: t.notes,
        needsReview: t.needsReview,
        sourceExcerpt: t.sourceExcerpt,
        createdAt: new Date(t.createdAt).toISOString().split('T')[0],
      })),
      openQuestions,
      hindrances,
      followUpEvents,
      transcript: [], // loaded on demand when viewing transcript tab
      speakerAnalytics: [
        {
          speaker: {
            id: 'user-self',
            name: 'Alex Vance',
            email: 'alex.vance@meettrack.ai',
            role: 'Meeting Host',
            initials: 'AV',
            color: '#3B82F6',
          },
          talkTimeMinutes: Math.round(durationMinutes * 0.48),
          percentage: 48,
          wordsPerMinute: 138,
          questionsAsked: 4,
          sentimentScore: 84,
        },
      ],
      engagement: {
        score: 88,
        sentiment: 'Engaged',
        participationBalance: 'Moderately Balanced',
        explanation: 'Active consensus with clear decisions and committed action items.',
        paceWpm: 142,
        totalQuestions: openQuestions.length + 3,
      },
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private parseJsonSafe(value: string | null, fallback: any): any {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
