import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TaskEntity } from '../database/entities/task.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async getEvents(): Promise<any[]> {
    const meetings = await this.meetingRepo.find({
      relations: ['report'],
      order: { date: 'ASC' },
    });
    const tasks = await this.taskRepo.find({
      order: { dueDate: 'ASC' },
    });

    const events: any[] = [];

    // Meetings
    for (const m of meetings) {
      events.push({
        id: `m-${m.id}`,
        title: m.title,
        date: m.date,
        time: m.startTime,
        type: 'meeting',
        platform: m.platform,
        status: m.status,
        assigneeOrHost: {
          id: 'host',
          name: 'Alex Vance',
          email: 'alex.vance@meettrack.ai',
          role: 'Organizer',
          initials: 'AV',
          color: '#3B82F6',
        },
        targetId: m.id,
        reportId: m.report?.id || undefined,
      });
    }

    // Task Deadlines
    for (const t of tasks) {
      if (!t.dueDate) continue;

      const hasAssignee = Boolean(t.assigneeName);
      events.push({
        id: `t-${t.id}`,
        title: t.title,
        date: t.dueDate,
        time: 'EOD',
        type: 'deadline',
        priority: t.priority,
        status: t.status,
        assigneeOrHost: hasAssignee
          ? {
              id: `p-${encodeURIComponent(t.assigneeName!)}`,
              name: t.assigneeName!,
              email: '',
              role: 'Task Owner',
              initials: t.assigneeName!.substring(0, 2).toUpperCase(),
              color: '#10B981',
            }
          : undefined,
        targetId: t.id,
        reportId: t.reportId || undefined,
      });
    }

    return events;
  }

  async getDeadlines(): Promise<{
    overdue: any[];
    today: any[];
    thisWeek: any[];
    later: any[];
  }> {
    const tasks = await this.taskRepo.find({
      relations: ['meeting'],
      order: { dueDate: 'ASC' },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Compute end of week (Sunday)
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const groups = {
      overdue: [] as any[],
      today: [] as any[],
      thisWeek: [] as any[],
      later: [] as any[],
    };

    for (const t of tasks) {
      if (t.status === 'done') continue;

      const dueDate = t.dueDate || todayStr;
      const formatted = {
        id: t.id,
        title: t.title,
        meetingId: t.meetingId,
        meetingTitle: t.meeting?.title,
        reportId: t.reportId,
        assignee: {
          id: 'assignee',
          name: t.assigneeName || 'Unassigned',
          initials: (t.assigneeName || 'UN').substring(0, 2).toUpperCase(),
          color: '#3B82F6',
        },
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        notes: t.notes,
        needsReview: t.needsReview,
      };

      if (dueDate < todayStr) {
        groups.overdue.push(formatted);
      } else if (dueDate === todayStr) {
        groups.today.push(formatted);
      } else if (dueDate <= endOfWeekStr) {
        groups.thisWeek.push(formatted);
      } else {
        groups.later.push(formatted);
      }
    }

    return groups;
  }

  /**
   * Produce standard RFC 5545 iCalendar (.ics) string
   */
  async exportIcs(): Promise<string> {
    const meetings = await this.meetingRepo.find();
    const tasks = await this.taskRepo.find({ where: { status: 'todo' } });

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MeetTrack AI//Meeting Intelligence Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:MeetTrack AI Schedule',
    ];

    // Add Meetings as VEVENT
    for (const m of meetings) {
      const dateClean = m.date.replace(/-/g, '');
      const dtStart = `${dateClean}T100000Z`;
      const dtEnd = `${dateClean}T110000Z`;

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:meet-${m.id}@meettrack.ai`);
      ics.push(`DTSTAMP:${nowStr}`);
      ics.push(`DTSTART:${dtStart}`);
      ics.push(`DTEND:${dtEnd}`);
      ics.push(`SUMMARY:${this.escapeIcs(m.title)}`);
      ics.push(
        `DESCRIPTION:Platform: ${m.platform}\\nStatus: ${m.status}${
          m.joinUrl ? `\\nJoin URL: ${m.joinUrl}` : ''
        }`,
      );
      if (m.joinUrl) {
        ics.push(`URL:${m.joinUrl}`);
      }
      ics.push('END:VEVENT');
    }

    // Add Task Deadlines as VTODO
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const dateClean = t.dueDate.replace(/-/g, '');
      const dtDue = `${dateClean}T180000Z`;

      ics.push('BEGIN:VTODO');
      ics.push(`UID:task-${t.id}@meettrack.ai`);
      ics.push(`DTSTAMP:${nowStr}`);
      ics.push(`DUE:${dtDue}`);
      ics.push(`SUMMARY:[Action Item] ${this.escapeIcs(t.title)}`);
      ics.push(
        `DESCRIPTION:Priority: ${t.priority}\\nOwner: ${t.assigneeName || 'Unassigned'}`,
      );
      ics.push(`PRIORITY:${t.priority === 'high' ? '1' : t.priority === 'medium' ? '5' : '9'}`);
      ics.push('END:VTODO');
    }

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  private escapeIcs(str: string): string {
    return str.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
  }
}
