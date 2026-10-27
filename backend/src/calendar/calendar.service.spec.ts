import { CalendarService } from './calendar.service';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { Repository } from 'typeorm';

describe('CalendarService', () => {
  let calendarService: CalendarService;
  let meetingRepo: Partial<Repository<MeetingEntity>>;
  let taskRepo: Partial<Repository<TaskEntity>>;

  beforeEach(() => {
    meetingRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'meet-1',
          title: 'Sprint Planning',
          date: '2026-10-28',
          startTime: '10:00 AM',
          durationMinutes: 45,
          platform: 'Google Meet',
          status: 'scheduled',
          joinUrl: 'https://meet.google.com/xyz',
          notes: 'Discuss Q4 roadmap',
          report: null,
        } as unknown as MeetingEntity,
      ]),
    };

    taskRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'task-1',
          title: 'Implement OAuth',
          dueDate: '2026-10-29',
          priority: 'high',
          status: 'todo',
          assigneeName: 'Alex Rivera',
          meeting: { id: 'meet-1', title: 'Sprint Planning' },
        } as unknown as TaskEntity,
      ]),
    };

    calendarService = new CalendarService(
      meetingRepo as Repository<MeetingEntity>,
      taskRepo as Repository<TaskEntity>,
    );
  });

  it('should derive calendar events from meetings and task deadlines', async () => {
    const events = await calendarService.getEvents();
    expect(events.length).toBe(2);

    const meetingEvent = events.find((e) => e.type === 'meeting');
    expect(meetingEvent).toBeDefined();
    expect(meetingEvent?.title).toBe('Sprint Planning');

    const deadlineEvent = events.find((e) => e.type === 'deadline');
    expect(deadlineEvent).toBeDefined();
    expect(deadlineEvent?.title).toBe('Implement OAuth');
  });

  it('should generate valid RFC 5545 iCalendar content', async () => {
    const ics = await calendarService.exportIcs();
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//MeetTrack AI//Meeting Intelligence Calendar//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Sprint Planning');
    expect(ics).toContain('BEGIN:VTODO');
    expect(ics).toContain('SUMMARY:[Action Item] Implement OAuth');
    expect(ics).toContain('END:VCALENDAR');
  });
});
