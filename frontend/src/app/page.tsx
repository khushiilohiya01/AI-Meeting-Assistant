'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { PlatformBadge, StatusBadge, PriorityBadge, AIPill } from '@/components/ui/Badge';
import {
  Calendar,
  Clock,
  ArrowUpRight,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Check,
  Radio,
  Repeat,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { formatFriendlyDate } from '@/lib/dates';
import * as api from '@/lib/api';

export default function DashboardPage() {
  const { meetings, reports, tasks, toggleTaskStatus, openAssistant } = useApp();
  const [overviewData, setOverviewData] = useState<any>(null);

  useEffect(() => {
    api
      .getDashboardOverview()
      .then((data) => setOverviewData(data))
      .catch((err) => console.warn('Could not load dashboard overview:', err));
  }, [meetings, reports, tasks]);

  // Filter upcoming meetings (scheduled)
  const upcomingMeetings = meetings
    .filter((m) => m.status === 'scheduled')
    .slice(0, 4);

  // Recent reports
  const recentReports = reports.slice(0, 3);

  // Tasks due soon (not done)
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const tasksDueSoon = pendingTasks.slice(0, 5);

  const todayStr = new Date().toISOString().split('T')[0];
  const totalMeetingsThisWeek = meetings.length;
  const pendingTasksCount = pendingTasks.length;
  const overdueDeadlinesCount = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr,
  ).length;
  const totalMeetingHours = Math.round(
    meetings.reduce((acc, m) => acc + (m.durationMinutes || 45), 0) / 60,
  );

  const recurringTopics = overviewData?.recurringTopics || [];

  return (
    <div className="space-y-8">
      {/* Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Workspace Overview
            </h1>
            <AIPill>Realtime Intelligence</AIPill>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            MeetTrack AI. Complete meeting notes, decision extraction, and persistent cross-meeting intelligence.
          </p>
        </div>

        {/* Start Assistant Action Button */}
        <button
          onClick={() => openAssistant()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20 self-start sm:self-auto"
        >
          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>Start Meeting Assistant</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-4 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recorded Meetings
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {totalMeetingsThisWeek}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> {upcomingMeetings.length} upcoming
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Across Zoom, Meet, & Teams
          </span>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:dark:border-slate-800/60 sm:pl-6">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pending Tasks
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {pendingTasksCount}
            </span>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {tasks.filter((t) => t.status === 'done').length} completed
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Derived from meeting dialogues
          </span>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:dark:border-slate-800/60 sm:pl-6">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Critical Deadlines
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {overdueDeadlinesCount}
            </span>
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {overdueDeadlinesCount > 0 ? 'Needs attention' : 'On track'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Overdue action items
          </span>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:dark:border-slate-800/60 sm:pl-6">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recorded Hours
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {totalMeetingHours}h
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Active Sync
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Persistent SQLite database
          </span>
        </div>
      </div>

      {/* Main Grid: Left 2 Cols (Meetings & Reports) + Right Rail (Tasks & Memory) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Upcoming Meetings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Upcoming Sessions</span>
                <span className="text-xs font-normal text-slate-400">
                  ({upcomingMeetings.length})
                </span>
              </h2>
              <Link
                href="/meetings"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all directory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500">No upcoming meetings scheduled.</p>
                <button
                  onClick={() => openAssistant()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-500" /> Start an Ad-Hoc Assistant Session
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-white dark:hover:bg-slate-900/60 p-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={meeting.platform} />
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {meeting.date} at {meeting.startTime}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDuration(meeting.durationMinutes)}
                        </span>
                      </div>

                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                      >
                        {meeting.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <AvatarGroup participants={meeting.participants} max={3} size="xs" />

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAssistant(meeting.id, meeting.title)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                          title="Start AI assistant capture for this meeting"
                        >
                          <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                          <span>Assist</span>
                        </button>

                        <Link
                          href={`/meetings/${meeting.id}`}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Details
                        </Link>

                        {meeting.joinUrl && (
                          <a
                            href={meeting.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Join</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reports Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Recent Intelligence Reports</span>
              </h2>
              <Link
                href="/reports"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Browse reports <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-500">No meeting reports synthesized yet.</p>
                <p className="text-[11px] text-slate-400">
                  Launch the Start Meeting Assistant to record and synthesize your first session.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="block p-4 rounded-xl hover:bg-white dark:hover:bg-slate-900/60 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 group"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={report.platform} />
                        <span className="text-[11px] font-mono text-slate-400">
                          {report.date}
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {report.engagement.score}/100 {report.engagement.sentiment}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>{report.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0" />
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/40 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <AvatarGroup participants={report.participants} max={3} size="xs" />
                        <span>{report.participants.length} participants</span>
                      </div>
                      <span>
                        {report.decisions.length} decisions · {report.actionItemIds.length} tasks
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Rail (4 cols): Tasks Due Soon + Cross-Meeting Memory */}
        <div className="lg:col-span-4 space-y-8">
          {/* Tasks Due Soon */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Tasks Due Soon
              </h2>
              <Link
                href="/tasks"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                All tasks <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tasksDueSoon.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                All caught up. No pending action items.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tasksDueSoon.map((task) => (
                  <div
                    key={task.id}
                    className="py-2.5 flex items-start gap-2.5 group hover:bg-white dark:hover:bg-slate-900/40 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 hover:border-blue-500 flex items-center justify-center shrink-0 transition-colors"
                    >
                      {task.status === 'done' && (
                        <Check className="w-3 h-3 text-emerald-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatFriendlyDate(task.dueDate)}</span>
                        <span>·</span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>

                    <Avatar participant={task.assignee} size="xs" showTooltip />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-Meeting Topic Memory */}
          <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-blue-500" />
                <span>Topic Memory</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {recurringTopics.length} Tracked
              </span>
            </div>

            {recurringTopics.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
                Cross-meeting topic memory will automatically detect recurring bottlenecks and unresolved issues across sessions.
              </div>
            ) : (
              <div className="space-y-2">
                {recurringTopics.map((topic: any) => (
                  <div
                    key={topic.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {topic.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {topic.occurrenceCount}x seen
                      </span>
                    </div>
                    {topic.resolutionEvidence && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        &quot;{topic.resolutionEvidence}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
