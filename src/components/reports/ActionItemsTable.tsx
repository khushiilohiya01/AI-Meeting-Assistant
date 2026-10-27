'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Task } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';
import { Check, ArrowUpRight, Calendar, User } from 'lucide-react';
import { formatFriendlyDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

export function ActionItemsTable({ actionItemIds }: { actionItemIds: string[] }) {
  const { tasks, toggleTaskStatus } = useApp();

  const reportTasks = tasks.filter((t) => actionItemIds.includes(t.id));

  if (reportTasks.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No action items recorded for this session.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
          {reportTasks.length} Assigned Action {reportTasks.length === 1 ? 'Item' : 'Items'}
        </span>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
        >
          Manage in Task Board <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {reportTasks.map((task) => {
          const isDone = task.status === 'done';

          return (
            <div
              key={task.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1 -mx-1 rounded-lg transition-colors"
            >
              {/* Left: Checkbox & Task Title */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id)}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
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
                      'text-xs font-medium block transition-all',
                      isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-100'
                    )}
                  >
                    {task.title}
                  </span>
                  {task.notes && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                      {task.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Assignee, Due Date & Priority */}
              <div className="flex items-center gap-4 text-xs pl-7 sm:pl-0 shrink-0">
                <div className="flex items-center gap-1.5" title={`Assignee: ${task.assignee.name}`}>
                  <Avatar participant={task.assignee} size="xs" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    {task.assignee.name.split(' ')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatFriendlyDate(task.dueDate)}</span>
                </div>

                <PriorityBadge priority={task.priority} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
