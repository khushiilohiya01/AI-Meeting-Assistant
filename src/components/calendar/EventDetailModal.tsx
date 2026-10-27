'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarEvent } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { PlatformBadge, PriorityBadge } from '@/components/ui/Badge';
import {
  X,
  Calendar,
  Clock,
  Video,
  FileText,
  ExternalLink,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';
import { formatFriendlyDate } from '@/lib/dates';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const isMeeting = event.type === 'meeting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isMeeting ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                <Video className="w-3 h-3" /> Scheduled Meeting
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Action Item Deadline
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {event.title}
          </h2>

          <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="text-slate-400">Scheduled Date:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatFriendlyDate(event.date)} ({event.date})
              </span>
            </div>

            {event.time && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">Time:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {event.time}
                </span>
              </div>
            )}

            {event.platform && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">Platform:</span>
                <PlatformBadge platform={event.platform} />
              </div>
            )}

            {event.priority && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">Priority:</span>
                <PriorityBadge priority={event.priority} />
              </div>
            )}

            {event.assigneeOrHost && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">
                  {isMeeting ? 'Meeting Lead:' : 'Assignee:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Avatar participant={event.assigneeOrHost} size="xs" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {event.assigneeOrHost.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="pt-2 flex items-center justify-end gap-2">
            {isMeeting ? (
              event.reportId ? (
                <Link
                  href={`/reports/${event.reportId}`}
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Intelligence Report</span>
                </Link>
              ) : (
                <Link
                  href={`/meetings/${event.targetId}`}
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>View Meeting Details</span>
                </Link>
              )
            ) : (
              <Link
                href="/tasks"
                onClick={onClose}
                className="w-full py-2 text-center text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Manage in Tasks Board</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
