'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CalendarEvent } from '@/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { EventDetailModal } from '@/components/calendar/EventDetailModal';
import { ConnectCalendarModal } from '@/components/calendar/ConnectCalendarModal';
import { AIPill } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { meetings, tasks } = useApp();

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Derive calendar events from meetings and tasks
  const events: CalendarEvent[] = [
    ...meetings.map((m) => ({
      id: `m-${m.id}`,
      title: m.title,
      date: m.date,
      time: m.startTime,
      type: 'meeting' as const,
      platform: m.platform,
      status: m.status,
      assigneeOrHost: m.participants[0],
      targetId: m.id,
      reportId: m.reportId,
    })),
    ...tasks.map((t) => ({
      id: `t-${t.id}`,
      title: t.title,
      date: t.dueDate,
      time: 'EOD',
      type: 'deadline' as const,
      priority: t.priority,
      status: t.status,
      assigneeOrHost: t.assignee,
      targetId: t.id,
      reportId: t.reportId,
    })),
  ];

  // Benchmark month: October 2026 (Oct 1 is Thursday -> 4 empty padding days Sun-Wed)
  const monthDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-10-${day < 10 ? `0${day}` : day}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    return {
      day,
      dateStr,
      isToday: dateStr === '2026-10-25',
      events: dayEvents,
    };
  });

  // Week days for Week view (Oct 25 to Oct 31, 2026)
  const weekDays = [
    { day: 25, dateStr: '2026-10-25', name: 'Sun', isToday: true },
    { day: 26, dateStr: '2026-10-26', name: 'Mon', isToday: false },
    { day: 27, dateStr: '2026-10-27', name: 'Tue', isToday: false },
    { day: 28, dateStr: '2026-10-28', name: 'Wed', isToday: false },
    { day: 29, dateStr: '2026-10-29', name: 'Thu', isToday: false },
    { day: 30, dateStr: '2026-10-30', name: 'Fri', isToday: false },
    { day: 31, dateStr: '2026-10-31', name: 'Sat', isToday: false },
  ];

  // Hours for Day view (Monday Oct 26)
  const dayHours = [
    { hour: '09:00 AM', events: [] },
    {
      hour: '10:00 AM',
      events: events.filter((e) => e.date === '2026-10-26' && e.time?.startsWith('10:00')),
    },
    { hour: '11:00 AM', events: [] },
    { hour: '12:00 PM', events: [] },
    { hour: '01:00 PM', events: [] },
    {
      hour: '02:00 PM',
      events: events.filter((e) => e.date === '2026-10-26' && e.time?.startsWith('02:30')),
    },
    { hour: '03:00 PM', events: [] },
    { hour: '04:00 PM', events: [] },
    { hour: '05:00 PM', events: [] },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Connect Calendar Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Calendar & Schedule
            </h1>
            <AIPill>Synchronized Timeline</AIPill>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unified view of upcoming recorded sessions, active processing, and action item deadlines.
          </p>
        </div>

        {/* Integration Panel Button */}
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>Connect Google / Outlook</span>
          <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 ml-1">
            Coming Soon
          </span>
        </button>
      </div>

      {/* Toolbar: Navigation + View Mode + Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Left: Month label & Previous/Next */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>October 2026</span>
          </h2>

          <div className="flex items-center gap-1 border border-slate-200/60 dark:border-slate-800 rounded-lg p-0.5">
            <button
              title="Previous period"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 px-1.5">
              Today
            </span>
            <button
              title="Next period"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Semantic Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Meetings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Deadlines</span>
          </div>
        </div>

        {/* Right: Month / Week / Day Segmented Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-all',
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-all',
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={cn(
              'px-3 py-1 rounded-lg font-medium transition-all',
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && (
        /* Month Grid */
        <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-center py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {/* September trailing days */}
            <div className="p-2 min-h-[90px] bg-slate-50/20 dark:bg-slate-950/20 opacity-30 text-xs">
              27
            </div>
            <div className="p-2 min-h-[90px] bg-slate-50/20 dark:bg-slate-950/20 opacity-30 text-xs">
              28
            </div>
            <div className="p-2 min-h-[90px] bg-slate-50/20 dark:bg-slate-950/20 opacity-30 text-xs">
              29
            </div>
            <div className="p-2 min-h-[90px] bg-slate-50/20 dark:bg-slate-950/20 opacity-30 text-xs">
              30
            </div>

            {/* October days 1 to 31 */}
            {monthDays.map((cell) => (
              <div
                key={cell.dateStr}
                className={cn(
                  'p-2 min-h-[105px] flex flex-col justify-between transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30',
                  cell.isToday && 'bg-blue-50/30 dark:bg-blue-950/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      cell.isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {cell.day}
                  </span>

                  {cell.events.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 mt-1 flex-1">
                  {cell.events.slice(0, 2).map((ev) => {
                    const isMeeting = ev.type === 'meeting';

                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 transition-transform hover:scale-[1.02]',
                          isMeeting
                            ? 'bg-blue-50/90 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40'
                            : 'bg-amber-50/90 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40'
                        )}
                      >
                        {isMeeting ? (
                          <Video className="w-2.5 h-2.5 shrink-0 opacity-80" />
                        ) : (
                          <Clock className="w-2.5 h-2.5 shrink-0 opacity-80" />
                        )}
                        <span className="truncate">{ev.title}</span>
                      </button>
                    );
                  })}

                  {cell.events.length > 2 && (
                    <button
                      onClick={() => setSelectedEvent(cell.events[2])}
                      className="text-[10px] text-slate-400 hover:text-blue-500 block truncate pl-1"
                    >
                      +{cell.events.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        /* Week View */
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((w) => {
            const dayEvents = events.filter((e) => e.date === w.dateStr);

            return (
              <div
                key={w.dateStr}
                className={cn(
                  'p-3 rounded-2xl border space-y-3 min-h-[360px] flex flex-col',
                  w.isToday
                    ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10'
                    : 'border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30'
                )}
              >
                <div className="flex items-baseline justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {w.name}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center',
                      w.isToday ? 'bg-blue-600 text-white' : 'text-slate-800 dark:text-slate-200'
                    )}
                  >
                    {w.day}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {dayEvents.map((ev) => {
                    const isMeeting = ev.type === 'meeting';

                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          'w-full text-left p-2 rounded-xl text-xs space-y-1 border transition-all hover:shadow-sm',
                          isMeeting
                            ? 'bg-blue-50/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 border-blue-200/50 dark:border-blue-800/40'
                            : 'bg-amber-50/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100 border-amber-200/50 dark:border-amber-800/40'
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-75">
                          <span>{ev.time}</span>
                          <span>{isMeeting ? 'Meeting' : 'Deadline'}</span>
                        </div>
                        <p className="font-semibold line-clamp-2 leading-tight">
                          {ev.title}
                        </p>
                      </button>
                    );
                  })}

                  {dayEvents.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-slate-400 italic">
                      Clear
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        /* Day View (Monday Oct 26) */
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                Monday, October 26, 2026
              </span>
              <span className="text-[11px] text-slate-400">
                2 upcoming sessions with live automated transcription
              </span>
            </div>
            <AIPill>2 Meetings</AIPill>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {dayHours.map((slot) => (
              <div key={slot.hour} className="py-3 flex items-start gap-4">
                <span className="w-20 text-xs font-mono text-slate-400 shrink-0 pt-0.5">
                  {slot.hour}
                </span>

                <div className="flex-1 space-y-2">
                  {slot.events.length > 0 ? (
                    slot.events.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100 cursor-pointer hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{ev.title}</span>
                          <span className="font-mono text-[11px] opacity-75">
                            {ev.time}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-75 mt-0.5">
                          Lead: {ev.assigneeOrHost?.name} · Platform: {ev.platform}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="h-6 border-b border-dashed border-slate-200/40 dark:border-slate-800/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Dialog */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Connect Calendar Modal */}
      <ConnectCalendarModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
