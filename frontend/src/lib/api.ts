import { Meeting, MeetingReport, Task, CalendarEvent } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const CAPTURE_SOCKET_URL =
  process.env.NEXT_PUBLIC_CAPTURE_SOCKET_URL || 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) {
        errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

// System Health
export async function getHealth(): Promise<any> {
  return await request<any>('/health');
}

// Meetings
export async function getMeetings(filters?: {
  status?: string;
  platform?: string;
  search?: string;
}): Promise<Meeting[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.platform && filters.platform !== 'all') params.set('platform', filters.platform);
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await request<any[]>(`/meetings${query}`);

  return data.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    startTime: m.startTime,
    durationMinutes: Math.round((m.durationSeconds || 2700) / 60),
    platform: m.platform,
    status: m.status,
    participants: [
      {
        id: 'host',
        name: 'Alex Vance',
        email: 'alex.vance@meettrack.ai',
        role: 'Host',
        initials: 'AV',
        color: '#3B82F6',
      },
    ],
    reportId: m.report?.id || undefined,
    joinUrl: m.joinUrl || undefined,
    agenda: m.agenda ? (typeof m.agenda === 'string' ? JSON.parse(m.agenda) : m.agenda) : [],
    notes: m.notes || undefined,
  }));
}

export async function getMeeting(id: string): Promise<Meeting> {
  const m = await request<any>(`/meetings/${id}`);
  return {
    id: m.id,
    title: m.title,
    date: m.date,
    startTime: m.startTime,
    durationMinutes: Math.round((m.durationSeconds || 2700) / 60),
    platform: m.platform,
    status: m.status,
    participants: [
      {
        id: 'host',
        name: 'Alex Vance',
        email: 'alex.vance@meettrack.ai',
        role: 'Host',
        initials: 'AV',
        color: '#3B82F6',
      },
    ],
    reportId: m.report?.id || undefined,
    joinUrl: m.joinUrl || undefined,
    agenda: m.agenda ? (typeof m.agenda === 'string' ? JSON.parse(m.agenda) : m.agenda) : [],
    notes: m.notes || undefined,
  };
}

export async function createMeeting(data: Partial<Meeting>): Promise<Meeting> {
  const m = await request<any>('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      platform: data.platform,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      joinUrl: data.joinUrl,
      agenda: data.agenda,
      notes: data.notes,
    }),
  });

  return {
    id: m.id,
    title: m.title,
    date: m.date,
    startTime: m.startTime,
    durationMinutes: Math.round((m.durationSeconds || 2700) / 60),
    platform: m.platform,
    status: m.status,
    participants: data.participants || [
      {
        id: 'host',
        name: 'Alex Vance',
        email: 'alex.vance@meettrack.ai',
        role: 'Host',
        initials: 'AV',
        color: '#3B82F6',
      },
    ],
    joinUrl: m.joinUrl || undefined,
    agenda: data.agenda || [],
    notes: m.notes || undefined,
  };
}

export async function updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
  const m = await request<any>(`/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return getMeeting(m.id);
}

export async function deleteMeeting(id: string): Promise<void> {
  await request<any>(`/meetings/${id}`, { method: 'DELETE' });
}

export async function createCaptureSession(meetingId: string): Promise<any> {
  return await request<any>(`/meetings/${meetingId}/capture-session`, { method: 'POST' });
}

export async function getMeetingStatus(meetingId: string): Promise<any> {
  return await request<any>(`/meetings/${meetingId}/status`);
}

export async function finalizeMeeting(meetingId: string): Promise<any> {
  return await request<any>(`/meetings/${meetingId}/finalize`, { method: 'POST' });
}

export async function reprocessMeeting(meetingId: string): Promise<any> {
  return await request<any>(`/meetings/${meetingId}/reprocess`, { method: 'POST' });
}

// Reports
export async function getReports(): Promise<MeetingReport[]> {
  return await request<MeetingReport[]>('/reports');
}

export async function getReport(id: string): Promise<MeetingReport> {
  return await request<MeetingReport>(`/reports/${id}`);
}

export async function getMeetingReport(meetingId: string): Promise<MeetingReport> {
  return await request<MeetingReport>(`/meetings/${meetingId}/report`);
}

export async function getMeetingTranscript(meetingId: string): Promise<any[]> {
  return await request<any[]>(`/meetings/${meetingId}/transcript`);
}

export async function createShare(
  reportId: string,
  options?: { includeTranscript?: boolean; expiryHours?: number },
): Promise<{ shareId: string; publicToken: string; expiresAt: string }> {
  return await request<any>(`/reports/${reportId}/share`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

export async function revokeShare(reportId: string, shareId: string): Promise<void> {
  await request<any>(`/reports/${reportId}/share/${shareId}`, { method: 'DELETE' });
}

export async function getPublicShare(token: string): Promise<any> {
  return await request<any>(`/public/shares/${token}`);
}

// Tasks
export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  assignee?: string;
  meeting?: string;
  search?: string;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  if (filters?.assignee && filters.assignee !== 'all') params.set('assignee', filters.assignee);
  if (filters?.meeting) params.set('meeting', filters.meeting);
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await request<Task[]>(`/tasks${query}`);
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  return await request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: taskData.title,
      meetingId: taskData.meetingId,
      reportId: taskData.reportId,
      assigneeName: taskData.assignee?.name,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: taskData.status,
      notes: taskData.notes,
    }),
  });
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
  return await request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: taskData.title,
      assigneeName: taskData.assignee?.name,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: taskData.status,
      notes: taskData.notes,
    }),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request<any>(`/tasks/${id}`, { method: 'DELETE' });
}

// Calendar & Deadlines
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return await request<CalendarEvent[]>('/calendar/events');
}

export async function getDeadlines(): Promise<{
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
  later: Task[];
}> {
  return await request<any>('/deadlines');
}

export function getCalendarIcsUrl(): string {
  return `${API_BASE_URL}/calendar/export.ics`;
}

// Dashboard & Search
export async function getDashboardOverview(): Promise<any> {
  return await request<any>('/dashboard/overview');
}

export async function globalSearch(query: string): Promise<{
  meetings: any[];
  reports: any[];
  tasks: any[];
}> {
  return await request<any>(`/search?q=${encodeURIComponent(query)}`);
}
