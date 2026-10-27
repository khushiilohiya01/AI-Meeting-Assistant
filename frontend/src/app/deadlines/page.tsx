'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Task } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge, AIPill } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Video,
  FileText,
  ArrowRight,
  Check,
} from 'lucide-react';
import { getUrgencyGroup, getUrgencyBadge, formatFriendlyDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

export default function DeadlinesPage() {
  const { tasks, toggleTaskStatus } = useApp();

  const groups: {
    overdue: Task[];
    today: Task[];
    this_week: Task[];
    later: Task[];
  } = {
    overdue: [],
    today: [],
    this_week: [],
    later: [],
  };

  for (const t of tasks) {
    const urgency = getUrgencyGroup(t.dueDate);
    groups[urgency].push(t);
  }

  const sections = [
    {
      id: 'overdue',
      title: 'Overdue Commitments',
      tasks: groups.overdue,
      badge: getUrgencyBadge('overdue'),
      icon: AlertTriangle,
      description: 'Tasks with elapsed due dates requiring immediate escalation or rescheduling.',
    },
    {
      id: 'today',
      title: 'Due Today',
      tasks: groups.today,
      badge: getUrgencyBadge('today'),
      icon: Clock,
      description: 'Deliverables due by close of business today.',
    },
    {
      id: 'this_week',
      title: 'Due This Week',
      tasks: groups.this_week,
      badge: getUrgencyBadge('this_week'),
      icon: Calendar,
      description: 'Milestones scheduled between Monday and Sunday.',
    },
    {
      id: 'later',
      title: 'Upcoming Later',
      tasks: groups.later,
      badge: getUrgencyBadge('later'),
      icon: CheckCircle2,
      description: 'Longer-horizon deliverables planned for upcoming sprints.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Deadlines & Urgency Schedule
          </h1>
          <AIPill>Time-Sensitive Tracking</AIPill>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Urgency-sorted action items cross-referenced with executive decisions and source transcripts.
        </p>
      </div>

      {/* Urgency Groups */}
      <div className="space-y-8">
        {sections.map((sec) => {
          const Icon = sec.icon;

          return (
            <div key={sec.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', sec.badge.textColor)} />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    {sec.title}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {sec.tasks.length}
                  </span>
                </div>
                <span className={cn('text-xs font-medium', sec.badge.textColor)}>
                  {sec.badge.label}
                </span>
              </div>

              {/* Tasks in this group */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sec.tasks.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400 italic">
                    No tasks currently in this urgency bracket.
                  </div>
                ) : (
                  sec.tasks.map((task) => {
                    const isDone = task.status === 'done';

                    return (
                      <div
                        key={task.id}
                        className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-white dark:hover:bg-slate-900/60 p-2 -mx-2 rounded-xl transition-all"
                      >
                        {/* Left: Checkbox & Task info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className={cn(
                              'mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all',
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                            )}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </button>

                          <div className="min-w-0">
                            <span
                              className={cn(
                                'text-xs sm:text-sm font-medium transition-all block',
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              )}
                            >
                              {task.title}
                            </span>

                            {task.meetingTitle && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Video className="w-3 h-3" />
                                <Link
                                  href={
                                    task.reportId
                                      ? `/reports/${task.reportId}`
                                      : `/meetings/${task.meetingId}`
                                  }
                                  className="hover:underline hover:text-blue-500 truncate"
                                >
                                  From: {task.meetingTitle}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Owner, Due Date, Priority & Status */}
                        <div className="flex items-center justify-between md:justify-end gap-4 text-xs pl-7 md:pl-0 shrink-0">
                          <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name}`}>
                            <Avatar participant={task.assignee} size="xs" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400">
                              {task.assignee.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.dueDate}</span>
                          </div>

                          <PriorityBadge priority={task.priority} />

                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
                              task.status === 'done'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : task.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
