import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { TopicMemoryEntity } from '../database/entities/topic-memory.entity';
import { OpenAiService } from '../ai/openai.service';
import { ReportsService } from '../reports/reports.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(MeetingReportEntity)
    private readonly reportRepo: Repository<MeetingReportEntity>,
    @InjectRepository(TopicMemoryEntity)
    private readonly topicMemoryRepo: Repository<TopicMemoryEntity>,
    private readonly openAiService: OpenAiService,
    private readonly reportsService: ReportsService,
    private readonly tasksService: TasksService,
  ) {}

  async getOverview() {
    const todayStr = new Date().toISOString().split('T')[0];

    const meetings = await this.meetingRepo.find({
      relations: ['report'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const tasks = await this.taskRepo.find({
      relations: ['meeting'],
      order: { dueDate: 'ASC' },
    });

    const reports = await this.reportsService.findAll();

    const recurringTopics = await this.topicMemoryRepo.find({
      where: [
        { status: 'recurring_unresolved' },
        { status: 'continuing' },
      ],
      order: { occurrenceCount: 'DESC', lastSeenAt: 'DESC' },
      take: 6,
    });

    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
    const totalSeconds = meetings.reduce((acc, m) => acc + (m.durationSeconds || 0), 0);
    const totalHours = Math.round(totalSeconds / 3600);

    const upcomingMeetings = meetings
      .filter((m) => m.status === 'scheduled')
      .slice(0, 4)
      .map((m) => ({
        id: m.id,
        title: m.title,
        platform: m.platform,
        status: m.status,
        date: m.date,
        startTime: m.startTime,
        durationMinutes: Math.round((m.durationSeconds || 2700) / 60),
        joinUrl: m.joinUrl,
        reportId: m.report?.id,
        participants: [
          {
            id: 'host',
            name: 'Alex Vance',
            email: 'alex.vance@meettrack.ai',
            role: 'Product Lead',
            initials: 'AV',
            color: '#3B82F6',
          },
        ],
      }));

    return {
      stats: {
        totalMeetingsThisWeek: meetings.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: tasks.filter((t) => t.status === 'done').length,
        overdueDeadlinesCount: overdueTasks.length,
        totalMeetingHours: totalHours,
        totalTopicsTracked: await this.topicMemoryRepo.count(),
        recurringTopicsCount: recurringTopics.length,
      },
      upcomingMeetings,
      recentReports: reports.slice(0, 3),
      tasksDueSoon: pendingTasks.slice(0, 5).map((t) => this.tasksService.formatTask(t)),
      recurringTopics: recurringTopics.map((rt) => ({
        id: rt.id,
        canonicalKey: rt.canonicalKey,
        title: rt.title,
        status: rt.status,
        occurrenceCount: rt.occurrenceCount,
        firstSeenAt: rt.firstSeenAt,
        lastSeenAt: rt.lastSeenAt,
        resolutionEvidence: rt.resolutionEvidence,
      })),
      system: {
        aiConfigured: this.openAiService.isConfigured(),
        transcriptionModel: this.openAiService.getTranscriptionModel(),
        analysisModel: this.openAiService.getAnalysisModel(),
      },
    };
  }

  async globalSearch(query: string) {
    if (!query || !query.trim()) {
      return { meetings: [], reports: [], tasks: [] };
    }

    const term = `%${query.trim().toLowerCase()}%`;

    const meetings = await this.meetingRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.report', 'r')
      .where('LOWER(m.title) LIKE :term OR LOWER(m.notes) LIKE :term', { term })
      .take(5)
      .getMany();

    const reports = await this.reportRepo
      .createQueryBuilder('rep')
      .leftJoinAndSelect('rep.meeting', 'm')
      .where(
        'LOWER(rep.summary) LIKE :term OR LOWER(rep.detailedSummary) LIKE :term OR LOWER(m.title) LIKE :term',
        { term },
      )
      .take(5)
      .getMany();

    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.meeting', 'm')
      .where(
        'LOWER(t.title) LIKE :term OR LOWER(t.notes) LIKE :term OR LOWER(t.assigneeName) LIKE :term',
        { term },
      )
      .take(5)
      .getMany();

    return {
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        reportId: m.report?.id,
        platform: m.platform,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        title: r.meeting ? r.meeting.title : 'Intelligence Report',
        date: r.meeting ? r.meeting.date : new Date(r.createdAt).toISOString().split('T')[0],
        summary: r.summary,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'MeetTrack AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: 'sqlite_connected',
      openai: {
        configured: this.openAiService.isConfigured(),
        transcriptionModel: this.openAiService.getTranscriptionModel(),
        analysisModel: this.openAiService.getAnalysisModel(),
      },
    };
  }
}
