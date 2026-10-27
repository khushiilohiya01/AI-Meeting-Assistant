'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';
import { PlatformBadge, StatusBadge, AIPill } from '@/components/ui/Badge';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  ArrowLeft,
  Users,
  CheckCircle2,
  ListTodo,
  FileText,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export default function MeetingDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { meetings } = useApp();

  const meeting = meetings.find((m) => m.id === id);

  // If this past meeting already has an AI report, provide direct jump
  useEffect(() => {
    if (meeting?.status === 'processed' && meeting.reportId) {
      router.replace(`/reports/${meeting.reportId}`);
    }
  }, [meeting, router]);

  if (!meeting) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Meeting Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested session could not be found or may have been deleted.
        </p>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </Link>
        <span className="text-xs text-slate-400">
          ID: <span className="font-mono">{meeting.id}</span>
        </span>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={meeting.platform} />
          <StatusBadge status={meeting.status} />
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {meeting.date} at {meeting.startTime}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatDuration(meeting.durationMinutes)}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {meeting.title}
        </h1>

        {/* Join button & actions */}
        <div className="flex items-center gap-3 pt-2">
          {meeting.joinUrl && (
            <a
              href={meeting.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-sm shadow-blue-500/20"
            >
              <span>Launch {meeting.platform} Session</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {meeting.reportId && (
            <Link
              href={`/reports/${meeting.reportId}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open AI Report</span>
            </Link>
          )}
        </div>
      </div>

      {/* Agenda & Prep Points */}
      <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Meeting Agenda & Prep Items</span>
          </h2>
          <AIPill>Auto Note-Taker Armed</AIPill>
        </div>

        {meeting.agenda && meeting.agenda.length > 0 ? (
          <ul className="space-y-2.5">
            {meeting.agenda.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No specific agenda topics provided. The AI assistant will automatically classify discussion streams during the call.
          </p>
        )}
      </div>

      {/* Organizer Notes */}
      {meeting.notes && (
        <div className="space-y-2 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Internal Prep Notes
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800">
            {meeting.notes}
          </p>
        </div>
      )}

      {/* Confirmed Attendees */}
      <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Confirmed Participants ({meeting.participants.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meeting.participants.map((participant) => (
            <div
              key={participant.id}
              className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3"
            >
              <Avatar participant={participant} size="md" />
              <div className="min-w-0">
                <span className="font-medium text-xs text-slate-900 dark:text-slate-100 block truncate">
                  {participant.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {participant.role}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {participant.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
