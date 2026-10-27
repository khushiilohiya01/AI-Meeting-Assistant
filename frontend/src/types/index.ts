export type MeetingPlatform = 'Zoom' | 'Google Meet' | 'Teams';

export type MeetingStatus = 'scheduled' | 'processing' | 'processed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  initials: string;
  color: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm format e.g. "10:00 AM"
  durationMinutes: number;
  platform: MeetingPlatform;
  status: MeetingStatus;
  participants: Participant[];
  reportId?: string;
  joinUrl?: string;
  agenda?: string[];
  notes?: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  timestamp?: string;
}

export interface Decision {
  id: string;
  decision: string;
  owner?: Participant;
  context?: string;
  timestamp?: string;
}

export interface TranscriptTurn {
  id: string;
  speaker: Participant;
  timestamp: string; // "04:12"
  seconds: number;
  text: string;
  sentiment?: 'neutral' | 'positive' | 'question' | 'concern';
}

export interface SpeakerMetric {
  speaker: Participant;
  talkTimeMinutes: number;
  percentage: number;
  wordsPerMinute?: number;
  questionsAsked?: number;
  sentimentScore?: number; // 0-100
}

export interface EngagementMetric {
  score: number; // 0-100
  sentiment: 'Positive' | 'Engaged' | 'Neutral' | 'Challenging';
  participationBalance: 'Even' | 'Moderately Balanced' | 'One Speaker Dominant';
  explanation: string;
  paceWpm: number;
  totalQuestions: number;
}

export interface MeetingReport {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  platform: MeetingPlatform;
  participants: Participant[];
  summary: string;
  keyTakeaways: string[];
  topics: Topic[];
  decisions: Decision[];
  actionItemIds: string[];
  transcript: TranscriptTurn[];
  speakerAnalytics: SpeakerMetric[];
  engagement: EngagementMetric;
}

export interface Task {
  id: string;
  title: string;
  meetingId: string;
  meetingTitle?: string;
  reportId?: string;
  assignee: Participant;
  assigneeName?: string | null;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  sourceExcerpt?: string;
  needsReview?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'meeting' | 'deadline';
  platform?: MeetingPlatform;
  status?: MeetingStatus | TaskStatus;
  priority?: TaskPriority;
  assigneeOrHost?: Participant;
  targetId: string; // meetingId or taskId
  reportId?: string;
}
