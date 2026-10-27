'use client';

import React, { useEffect, useState } from 'react';
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
  Radio,
  Trash2,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import * as api from '@/lib/api';
import { Meeting } from '@/types';

export default function MeetingDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { meetings, openAssistant, deleteMeeting } = useApp();
  const meetingFromContext = meetings.find((m) => m.id === id);
  const [meetingFromApi, setMeetingFromApi] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(!meetingFromContext);

  const meeting = meetingFromContext || meetingFromApi || undefined;

  useEffect(() => {
    if (meetingFromContext) return;
    let isCancelled = false;
    api
      .getMeeting(id)
      .then((m) => {
        if (!isCancelled) {
          setMeetingFromApi(m);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [id, meetingFromContext]);

  // If this past meeting already has an AI report, provide direct jump
  useEffect(() => {
    if (meeting?.status === 'processed' && meeting.reportId) {
      router.replace(`/reports/${meeting.reportId}`);
    }
  }, [meeting, router]);

  if (isLoading) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-2">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Loading meeting details...</p>
      </div>
    );
  }

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

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      await deleteMeeting(meeting.id);
      router.push('/meetings');
    }
  };

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
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            ID: {meeting.id}
          </span>
          <button
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-700 p-1 rounded"
            title="Delete Meeting"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Start Assistant Capture Button */}
          <button
            onClick={() => openAssistant(meeting.id, meeting.title)}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-all inline-flex items-center gap-2 shadow-sm shadow-rose-500/20 active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Launch Meeting Assistant</span>
          </button>

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
    </div>
  );
}
