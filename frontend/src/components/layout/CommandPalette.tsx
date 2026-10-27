'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Video,
  CheckSquare,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Meeting, MeetingReport, Task } from '@/types';
import * as api from '@/lib/api';

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { meetings, reports, tasks } = useApp();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    meetings: Meeting[];
    reports: MeetingReport[];
    tasks: Task[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Async backend search with debounce
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      api
        .globalSearch(query)
        .then((res) =>
          setSearchResults(
            res as unknown as {
              meetings: Meeting[];
              reports: MeetingReport[];
              tasks: Task[];
            },
          ),
        )
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const q = query.toLowerCase().trim();
  const effectiveResults = q ? searchResults : null;

  // Combine local and backend results
  const filteredMeetings = effectiveResults
    ? effectiveResults.meetings
    : q
    ? meetings
        .filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.participants.some((p) => p.name.toLowerCase().includes(q)),
        )
        .slice(0, 3)
    : meetings.slice(0, 3);

  const filteredReports = effectiveResults
    ? effectiveResults.reports
    : q
    ? reports
        .filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.summary.toLowerCase().includes(q),
        )
        .slice(0, 3)
    : reports.slice(0, 3);

  const filteredTasks = effectiveResults
    ? effectiveResults.tasks
    : q
    ? tasks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.assignee.name.toLowerCase().includes(q),
        )
        .slice(0, 3)
    : tasks.slice(0, 3);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search meetings, reports, transcripts, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Reports Section */}
          {filteredReports.length > 0 && (
            <div className="py-2 first:pt-0">
              <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Intelligence Reports
              </span>
              {filteredReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(`/reports/${r.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block truncate">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {r.date}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Meetings Section */}
          {filteredMeetings.length > 0 && (
            <div className="py-2">
              <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Meetings
              </span>
              {filteredMeetings.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    handleSelect(
                      m.reportId ? `/reports/${m.reportId}` : `/meetings/${m.id}`,
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block truncate">
                        {m.title}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {m.date} · {m.platform}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Tasks Section */}
          {filteredTasks.length > 0 && (
            <div className="py-2">
              <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Action Items
              </span>
              {filteredTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect('/tasks')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckSquare className="w-4 h-4 text-purple-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block truncate">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Due {t.dueDate || 'Soon'} · {t.assignee?.name || t.assigneeName || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {filteredMeetings.length === 0 &&
            filteredReports.length === 0 &&
            filteredTasks.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No meetings, dossiers, or action items match &quot;{query}&quot;.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { isSearchOpen, setIsSearchOpen } = useApp();

  if (!isSearchOpen) return null;

  return (
    <CommandPaletteDialog
      key="active-command-palette"
      onClose={() => setIsSearchOpen(false)}
    />
  );
}
