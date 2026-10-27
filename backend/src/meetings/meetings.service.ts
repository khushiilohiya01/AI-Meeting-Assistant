import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MeetingEntity, MeetingStatus } from '../database/entities/meeting.entity';
import { CaptureSessionEntity } from '../database/entities/capture-session.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { TopicMemoryEntity } from '../database/entities/topic-memory.entity';
import { TopicOccurrenceEntity } from '../database/entities/topic-occurrence.entity';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { AnalysisService } from '../ai/analysis.service';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
    @InjectRepository(CaptureSessionEntity)
    private readonly captureSessionRepo: Repository<CaptureSessionEntity>,
    @InjectRepository(TranscriptSegmentEntity)
    private readonly transcriptRepo: Repository<TranscriptSegmentEntity>,
    @InjectRepository(MeetingReportEntity)
    private readonly reportRepo: Repository<MeetingReportEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(TopicMemoryEntity)
    private readonly topicMemoryRepo: Repository<TopicMemoryEntity>,
    @InjectRepository(TopicOccurrenceEntity)
    private readonly topicOccurrenceRepo: Repository<TopicOccurrenceEntity>,
    private readonly analysisService: AnalysisService,
  ) {}

  async create(dto: CreateMeetingDto): Promise<MeetingEntity> {
    const id = `meet-${uuidv4()}`;
    const agendaText = Array.isArray(dto.agenda)
      ? JSON.stringify(dto.agenda)
      : typeof dto.agenda === 'string'
      ? JSON.stringify(dto.agenda.split('\n').filter(Boolean))
      : null;

    const todayStr = new Date().toISOString().split('T')[0];

    const meeting = this.meetingRepo.create({
      id,
      title: dto.title.trim(),
      platform: dto.platform || 'Google Meet',
      status: 'scheduled',
      date: dto.date || todayStr,
      startTime: dto.startTime || '10:00 AM',
      durationSeconds: (dto.durationMinutes || 45) * 60,
      joinUrl:
        dto.joinUrl ||
        `https://${(dto.platform || 'meet').toLowerCase().replace(/\s+/g, '')}.com/join/${uuidv4().substring(0, 8)}`,
      agenda: agendaText,
      notes: dto.notes || null,
      errorMessage: null,
    });

    return await this.meetingRepo.save(meeting);
  }

  async findAll(query?: { status?: string; platform?: string; search?: string }): Promise<MeetingEntity[]> {
    const qb = this.meetingRepo
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.report', 'report')
      .orderBy('meeting.date', 'DESC')
      .addOrderBy('meeting.createdAt', 'DESC');

    if (query?.status && query.status !== 'all') {
      qb.andWhere('meeting.status = :status', { status: query.status });
    }

    if (query?.platform && query.platform !== 'all') {
      qb.andWhere('meeting.platform = :platform', { platform: query.platform });
    }

    if (query?.search && query.search.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(meeting.title) LIKE :term OR LOWER(meeting.notes) LIKE :term)', { term });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<MeetingEntity> {
    const meeting = await this.meetingRepo.findOne({
      where: { id },
      relations: ['report', 'tasks', 'captureSessions'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<MeetingEntity> {
    const meeting = await this.findOne(id);

    if (dto.title !== undefined) meeting.title = dto.title.trim();
    if (dto.platform !== undefined) meeting.platform = dto.platform;
    if (dto.status !== undefined) meeting.status = dto.status;
    if (dto.date !== undefined) meeting.date = dto.date;
    if (dto.startTime !== undefined) meeting.startTime = dto.startTime;
    if (dto.durationMinutes !== undefined) meeting.durationSeconds = dto.durationMinutes * 60;
    if (dto.joinUrl !== undefined) meeting.joinUrl = dto.joinUrl;
    if (dto.notes !== undefined) meeting.notes = dto.notes;
    if (dto.agenda !== undefined) {
      meeting.agenda = Array.isArray(dto.agenda)
        ? JSON.stringify(dto.agenda)
        : JSON.stringify(dto.agenda.split('\n').filter(Boolean));
    }

    return await this.meetingRepo.save(meeting);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const meeting = await this.findOne(id);
    await this.meetingRepo.remove(meeting);
    return { success: true };
  }

  async createCaptureSession(meetingId: string): Promise<any> {
    const meeting = await this.findOne(meetingId);

    // Update meeting status to capturing
    meeting.status = 'capturing';
    meeting.startTimeUtc = new Date();
    await this.meetingRepo.save(meeting);

    const session = this.captureSessionRepo.create({
      id: `cs-${uuidv4()}`,
      meetingId: meeting.id,
      status: 'active',
      startedAt: new Date(),
      lastActivityAt: new Date(),
      lastSequenceNumber: 0,
      errorMessage: null,
    });

    const saved = await this.captureSessionRepo.save(session);
    return {
      sessionId: saved.id,
      captureToken: `${saved.id}.${uuidv4()}`,
      meetingId: meeting.id,
      status: saved.status,
    };
  }

  async getStatus(meetingId: string) {
    const meeting = await this.findOne(meetingId);
    const segmentCount = await this.transcriptRepo.count({ where: { meetingId } });
    const latestSession = await this.captureSessionRepo.findOne({
      where: { meetingId },
      order: { startedAt: 'DESC' },
    });

    return {
      meetingId: meeting.id,
      status: meeting.status,
      startTimeUtc: meeting.startTimeUtc,
      endTimeUtc: meeting.endTimeUtc,
      durationSeconds: meeting.durationSeconds,
      segmentCount,
      hasReport: Boolean(meeting.report),
      reportId: meeting.report?.id || null,
      session: latestSession || null,
      errorMessage: meeting.errorMessage,
    };
  }

  async finalizeAndGenerateReport(meetingId: string): Promise<MeetingReportEntity> {
    const meeting = await this.findOne(meetingId);

    // Update status to analyzing
    meeting.status = 'analyzing';
    meeting.endTimeUtc = new Date();
    if (meeting.startTimeUtc) {
      const diffSecs = Math.max(
        15,
        Math.round((meeting.endTimeUtc.getTime() - new Date(meeting.startTimeUtc).getTime()) / 1000),
      );
      meeting.durationSeconds = diffSecs;
    }
    await this.meetingRepo.save(meeting);

    // Assemble stored transcript segments in sequence order
    const segments = await this.transcriptRepo.find({
      where: { meetingId },
      order: { sequenceNumber: 'ASC' },
    });

    const fullTranscript = segments.map((s) => s.text).join('\n');
    this.logger.log(
      `Assembled ${segments.length} segments (${fullTranscript.length} chars) for meeting ${meetingId}`,
    );

    try {
      const aiResult = await this.analysisService.generateMeetingReport({
        title: meeting.title,
        date: meeting.date,
        transcriptText: fullTranscript,
        agenda: meeting.agenda || undefined,
        notes: meeting.notes || undefined,
      });

      // Save report and tasks in a transaction
      let report = await this.reportRepo.findOne({ where: { meetingId } });
      if (!report) {
        report = this.reportRepo.create({
          id: `rep-${uuidv4()}`,
          meetingId,
          meeting,
          summary: aiResult.summary,
          detailedSummary: aiResult.detailedSummary,
          keyTakeaways: JSON.stringify(aiResult.keyTakeaways || []),
          topics: JSON.stringify(aiResult.topics || []),
          decisions: JSON.stringify(aiResult.decisions || []),
          openQuestions: JSON.stringify(aiResult.openQuestions || []),
          hindrances: JSON.stringify(aiResult.hindrances || []),
          followUpEvents: JSON.stringify(aiResult.followUpEvents || []),
          analysisStatus: 'completed',
        });
      } else {
        report.meeting = meeting;
        report.meetingId = meetingId;
        report.summary = aiResult.summary;
        report.detailedSummary = aiResult.detailedSummary;
        report.keyTakeaways = JSON.stringify(aiResult.keyTakeaways || []);
        report.topics = JSON.stringify(aiResult.topics || []);
        report.decisions = JSON.stringify(aiResult.decisions || []);
        report.openQuestions = JSON.stringify(aiResult.openQuestions || []);
        report.hindrances = JSON.stringify(aiResult.hindrances || []);
        report.followUpEvents = JSON.stringify(aiResult.followUpEvents || []);
        report.analysisStatus = 'completed';
      }

      report = await this.reportRepo.save(report);

      // Persist extracted action items as Tasks
      if (aiResult.actionItems && aiResult.actionItems.length > 0) {
        for (const item of aiResult.actionItems) {
          const task = this.taskRepo.create({
            id: `task-${uuidv4()}`,
            meetingId: meeting.id,
            reportId: report.id,
            title: item.title,
            assigneeName: item.assigneeName || null,
            dueDate: item.dueDate || null,
            priority: item.priority || 'medium',
            status: item.status || 'todo',
            notes: item.notes || null,
            sourceExcerpt: item.sourceExcerpt || null,
            needsReview: item.needsReview !== undefined ? item.needsReview : true,
          });
          await this.taskRepo.save(task);
        }
      }

      // Cross-meeting topic memory reconciliation
      if (aiResult.topics && aiResult.topics.length > 0) {
        await this.updateTopicMemories(meeting.id, aiResult.topics, fullTranscript);
      }

      meeting.status = 'processed';
      meeting.errorMessage = null;
      meeting.report = report;
      await this.meetingRepo.save(meeting);

      this.logger.log(`Meeting ${meetingId} successfully processed and report created`);
      delete (report as any).meeting;
      return report;
    } catch (err: any) {
      this.logger.error(`Failed to generate final report for meeting ${meetingId}: ${err.message}`);
      meeting.status = segments.length > 0 ? 'partial' : 'failed';
      meeting.errorMessage = err.message;
      await this.meetingRepo.save(meeting);
      throw err;
    }
  }

  async reprocess(meetingId: string): Promise<MeetingReportEntity> {
    return await this.finalizeAndGenerateReport(meetingId);
  }

  private async updateTopicMemories(
    meetingId: string,
    extractedTopics: any[],
    transcriptContext: string,
  ): Promise<void> {
    for (const t of extractedTopics) {
      const canonicalKey = (
        t.canonicalKey ||
        t.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      ).substring(0, 120);

      let memory = await this.topicMemoryRepo.findOne({ where: { canonicalKey } });

      if (!memory) {
        memory = this.topicMemoryRepo.create({
          id: `topic-${uuidv4()}`,
          canonicalKey,
          title: t.title,
          status: 'new',
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          occurrenceCount: 1,
          resolutionEvidence: null,
        });
      } else {
        memory.lastSeenAt = new Date();
        memory.occurrenceCount += 1;
        // Check if previously unresolved
        if (memory.status === 'recurring_unresolved' || memory.status === 'continuing') {
          const recon = await this.analysisService.reconcileTopicMemory({
            currentTopicTitle: t.title,
            priorTopicTitle: memory.title,
            currentDiscussionEvidence: t.summary || transcriptContext.substring(0, 500),
          });
          memory.status = recon.status;
          memory.resolutionEvidence = recon.evidence;
        } else {
          memory.status = 'continuing';
        }
      }

      memory = await this.topicMemoryRepo.save(memory);

      const occurrence = this.topicOccurrenceRepo.create({
        id: `tocc-${uuidv4()}`,
        topicId: memory.id,
        meetingId,
        evidence: t.summary || null,
        meetingStatus: 'processed',
      });
      await this.topicOccurrenceRepo.save(occurrence);
    }
  }
}
