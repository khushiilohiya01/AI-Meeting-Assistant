export interface TopicExtraction {
  title: string;
  summary: string;
  bullets: string[];
  timestamp: string | null;
  canonicalKey: string;
}

export interface DecisionExtraction {
  decision: string;
  context: string | null;
  ownerName: string | null;
  timestamp: string | null;
  sourceExcerpt: string | null;
}

export interface ActionItemExtraction {
  title: string;
  assigneeName: string | null;
  dueDate: string | null; // YYYY-MM-DD if determinable
  deadlineText: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  notes: string | null;
  sourceExcerpt: string | null;
  needsReview: boolean;
}

export interface OpenQuestionExtraction {
  question: string;
  context: string | null;
}

export interface HindranceExtraction {
  topic: string;
  description: string;
  occurrences: number;
  status: 'unresolved' | 'recurring_unresolved' | 'resolved';
  evidence: string[];
}

export interface FollowUpEventExtraction {
  title: string;
  date: string | null;
  time: string | null;
  notes: string | null;
  needsReview: boolean;
}

export interface MeetingAnalysisResult {
  summary: string;
  detailedSummary: string;
  keyTakeaways: string[];
  topics: TopicExtraction[];
  decisions: DecisionExtraction[];
  actionItems: ActionItemExtraction[];
  openQuestions: OpenQuestionExtraction[];
  hindrances: HindranceExtraction[];
  followUpEvents: FollowUpEventExtraction[];
}

export interface IncrementalInsightsResult {
  topics: string[];
  keyPoints: string[];
  draftDecisions: string[];
  candidateActionItems: {
    title: string;
    assigneeName: string | null;
    priority: 'low' | 'medium' | 'high';
    needsReview: boolean;
  }[];
  potentialRecurringTopics: string[];
}

export const MEETING_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Brief 2-3 sentence executive summary of the meeting.',
    },
    detailedSummary: {
      type: 'string',
      description: 'In-depth chronological walkthrough of the discussion from beginning to end.',
    },
    keyTakeaways: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key insights and takeaways.',
    },
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
          timestamp: { type: ['string', 'null'] },
          canonicalKey: {
            type: 'string',
            description: 'Normalized snake_case identifier for cross-meeting topic memory matching.',
          },
        },
        required: ['title', 'summary', 'bullets', 'timestamp', 'canonicalKey'],
        additionalProperties: false,
      },
    },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          decision: { type: 'string' },
          context: { type: ['string', 'null'] },
          ownerName: { type: ['string', 'null'] },
          timestamp: { type: ['string', 'null'] },
          sourceExcerpt: { type: ['string', 'null'] },
        },
        required: ['decision', 'context', 'ownerName', 'timestamp', 'sourceExcerpt'],
        additionalProperties: false,
      },
    },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          assigneeName: { type: ['string', 'null'] },
          dueDate: { type: ['string', 'null'] },
          deadlineText: { type: ['string', 'null'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
          notes: { type: ['string', 'null'] },
          sourceExcerpt: { type: ['string', 'null'] },
          needsReview: { type: 'boolean' },
        },
        required: [
          'title',
          'assigneeName',
          'dueDate',
          'deadlineText',
          'priority',
          'status',
          'notes',
          'sourceExcerpt',
          'needsReview',
        ],
        additionalProperties: false,
      },
    },
    openQuestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          context: { type: ['string', 'null'] },
        },
        required: ['question', 'context'],
        additionalProperties: false,
      },
    },
    hindrances: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          description: { type: 'string' },
          occurrences: { type: 'number' },
          status: { type: 'string', enum: ['unresolved', 'recurring_unresolved', 'resolved'] },
          evidence: { type: 'array', items: { type: 'string' } },
        },
        required: ['topic', 'description', 'occurrences', 'status', 'evidence'],
        additionalProperties: false,
      },
    },
    followUpEvents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: ['string', 'null'] },
          time: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          needsReview: { type: 'boolean' },
        },
        required: ['title', 'date', 'time', 'notes', 'needsReview'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'summary',
    'detailedSummary',
    'keyTakeaways',
    'topics',
    'decisions',
    'actionItems',
    'openQuestions',
    'hindrances',
    'followUpEvents',
  ],
  additionalProperties: false,
};

export const INCREMENTAL_INSIGHTS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topics: { type: 'array', items: { type: 'string' } },
    keyPoints: { type: 'array', items: { type: 'string' } },
    draftDecisions: { type: 'array', items: { type: 'string' } },
    candidateActionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          assigneeName: { type: ['string', 'null'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          needsReview: { type: 'boolean' },
        },
        required: ['title', 'assigneeName', 'priority', 'needsReview'],
        additionalProperties: false,
      },
    },
    potentialRecurringTopics: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'topics',
    'keyPoints',
    'draftDecisions',
    'candidateActionItems',
    'potentialRecurringTopics',
  ],
  additionalProperties: false,
};
