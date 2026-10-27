import { Meeting, MeetingReport, Task, CalendarEvent } from '@/types';
import { meetings as seedMeetings } from '@/data/meetings';
import { reports as seedReports } from '@/data/reports';
import { initialTasks as seedTasks } from '@/data/tasks';
import { getUrgencyGroup } from './dates';

const STORAGE_KEY_TASKS = 'vesper_tasks_v1';
const STORAGE_KEY_MEETINGS = 'vesper_meetings_v1';

// In-memory cache for SSR and client runtime
let inMemoryTasks: Task[] = [...seedTasks];
let inMemoryMeetings: Meeting[] = [...seedMeetings];
const inMemoryReports: MeetingReport[] = [...seedReports];

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function loadInitialTasks(): Task[] {
  if (!isClient()) return seedTasks;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryTasks = parsed;
        return inMemoryTasks;
      }
    }
  } catch (e) {
    console.warn('Failed to load tasks from localStorage', e);
  }
  return inMemoryTasks;
}

function persistTasks(tasks: Task[]) {
  inMemoryTasks = tasks;
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to persist tasks to localStorage', e);
  }
}

export function getMeetings(): Meeting[] {
  return inMemoryMeetings;
}

export function getMeeting(id: string): Meeting | undefined {
  return inMemoryMeetings.find((m) => m.id === id);
}

export function createMeeting(newMeetingData: Omit<Meeting, 'id'>): Meeting {
  const newMeeting: Meeting = {
    ...newMeetingData,
    id: `meet-${Date.now()}`,
  };
  inMemoryMeetings = [newMeeting, ...inMemoryMeetings];
  return newMeeting;
}

export function getReports(): MeetingReport[] {
  return inMemoryReports;
}

export function getReport(id: string): MeetingReport | undefined {
  return inMemoryReports.find((r) => r.id === id);
}

export function getTasks(): Task[] {
  return loadInitialTasks();
}

export function addTask(
  taskData: Omit<Task, 'id' | 'createdAt'>
): Task {
  const newTask: Task = {
    ...taskData,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  const updated = [newTask, ...getTasks()];
  persistTasks(updated);
  return newTask;
}

export function updateTask(updatedTask: Task): Task {
  const current = getTasks();
  const next = current.map((t) => (t.id === updatedTask.id ? updatedTask : t));
  persistTasks(next);
  return updatedTask;
}

export function deleteTask(taskId: string): void {
  const current = getTasks();
  const next = current.filter((t) => t.id !== taskId);
  persistTasks(next);
}

export function toggleTaskStatus(taskId: string): Task | undefined {
  const current = getTasks();
  let updatedTask: Task | undefined;
  const next = current.map((t) => {
    if (t.id === taskId) {
      const newStatus = t.status === 'done' ? 'todo' : 'done';
      updatedTask = {
        ...t,
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date().toISOString().split('T')[0] : undefined,
      };
      return updatedTask;
    }
    return t;
  });
  persistTasks(next);
  return updatedTask;
}

export function getDeadlines() {
  const tasks = getTasks();
  const groups: {
    overdue: Task[];
    today: Task[];
    thisWeek: Task[];
    later: Task[];
  } = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
  };

  for (const task of tasks) {
    const urgency = getUrgencyGroup(task.dueDate);
    if (urgency === 'overdue') groups.overdue.push(task);
    else if (urgency === 'today') groups.today.push(task);
    else if (urgency === 'this_week') groups.thisWeek.push(task);
    else groups.later.push(task);
  }

  return groups;
}

export function getCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Meetings
  for (const m of getMeetings()) {
    events.push({
      id: `cal-m-${m.id}`,
      title: m.title,
      date: m.date,
      time: m.startTime,
      type: 'meeting',
      platform: m.platform,
      status: m.status,
      assigneeOrHost: m.participants[0],
      targetId: m.id,
      reportId: m.reportId,
    });
  }

  // Task Deadlines
  for (const t of getTasks()) {
    events.push({
      id: `cal-t-${t.id}`,
      title: t.title,
      date: t.dueDate,
      time: 'EOD',
      type: 'deadline',
      priority: t.priority,
      status: t.status,
      assigneeOrHost: t.assignee,
      targetId: t.id,
      reportId: t.reportId,
    });
  }

  return events;
}
