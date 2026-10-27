import React from 'react';
import { MeetingPlatform, MeetingStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';
import { Video, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function PlatformBadge({ platform, className }: { platform: MeetingPlatform; className?: string }) {
  const config = {
    Zoom: 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/40',
    'Google Meet': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40',
    Teams: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-800/40',
  }[platform] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        config,
        className
      )}
    >
      <Video className="w-3 h-3 opacity-80" />
      {platform}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  switch (status) {
    case 'processed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/40 dark:border-emerald-800/30',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Processed
        </span>
      );
    case 'processing':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/40 dark:border-amber-800/30',
            className
          )}
        >
          <Clock className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    case 'scheduled':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/40 dark:border-blue-800/30',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Scheduled
        </span>
      );
    case 'failed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/40 dark:border-rose-800/30',
            className
          )}
        >
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
  }
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const config = {
    high: {
      label: 'High',
      styles: 'text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30',
      dot: 'bg-rose-500',
    },
    medium: {
      label: 'Medium',
      styles: 'text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'Low',
      styles: 'text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/30',
      dot: 'bg-slate-400',
    },
  }[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export function AIPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        className
      )}
    >
      <Sparkles className="w-3 h-3 text-blue-500" />
      {children}
    </span>
  );
}
