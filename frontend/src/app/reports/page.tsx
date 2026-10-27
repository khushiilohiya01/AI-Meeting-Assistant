'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarGroup } from '@/components/ui/Avatar';
import { PlatformBadge, AIPill } from '@/components/ui/Badge';
import { Search, Filter, ArrowUpRight, Sparkles, X, ChevronDown } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { MeetingPlatform } from '@/types';

export default function ReportsPage() {
  const { reports } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedPlatform !== 'all' ||
    selectedSentiment !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('all');
    setSelectedSentiment('all');
    setSortBy('newest');
  };

  const filteredReports = reports
    .filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.topics.some((t) => t.title.toLowerCase().includes(q)) ||
        r.participants.some((p) => p.name.toLowerCase().includes(q));

      const matchesPlatform =
        selectedPlatform === 'all' || r.platform === selectedPlatform;

      const matchesSentiment =
        selectedSentiment === 'all' || r.engagement.sentiment === selectedSentiment;

      return matchesSearch && matchesPlatform && matchesSentiment;
    })
    .sort((a, b) => {
      return sortBy === 'newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Intelligence Reports
          </h1>
          <AIPill>{reports.length} Synthesized</AIPill>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Executive briefings, consensus decisions, action items, and conversational telemetry.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by topic, decision, or attendee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="Google Meet">Google Meet</option>
            <option value="Zoom">Zoom</option>
            <option value="Teams">Microsoft Teams</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Engaged">Engaged</option>
            <option value="Neutral">Neutral</option>
          </select>

          {/* Sort Menu */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {/* Clear Filter button */}
          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Reports List - Minimalist, non-boxy, typography-first */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No intelligence reports match your active filters.
          </div>
        ) : (
          filteredReports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="group block p-4 sm:p-5 rounded-xl transition-all duration-150 hover:bg-white dark:hover:bg-slate-900/80 hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-black/40 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={report.platform} />
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {report.date}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDuration(report.durationMinutes)}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/40 dark:border-emerald-800/40">
                      {report.engagement.score}/100 {report.engagement.sentiment}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span>{report.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0" />
                  </h2>

                  {/* Summary Snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {report.summary}
                  </p>

                  {/* Topics Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {report.topics.map((t) => (
                      <span
                        key={t.id}
                        className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 px-2 py-0.5 rounded-md"
                      >
                        #{t.title.split(':')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Attendees & Quick Stats */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                  <AvatarGroup participants={report.participants} max={4} size="sm" />
                  <div className="text-right text-[11px] text-slate-400">
                    <span>{report.decisions.length} decisions</span>
                    <span className="mx-1">·</span>
                    <span>{report.actionItemIds.length} tasks</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
