'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AvatarGroup } from '@/components/ui/Avatar';
import { PlatformBadge, StatusBadge, AIPill } from '@/components/ui/Badge';
import {
  Search,
  Filter,
  ArrowUpRight,
  Video,
  Calendar,
  ExternalLink,
  Plus,
  X,
  FileText,
  Radio,
  Trash2,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { MeetingStatus, MeetingPlatform } from '@/types';

export default function MeetingsPage() {
  const router = useRouter();
  const { meetings, openAssistant, deleteMeeting } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedPlatform !== 'all' ||
    activeTab !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedStatus('all');
    setSelectedPlatform('all');
    setSortBy('newest');
  };

  const filteredMeetings = meetings
    .filter((m) => {
      // Tab filter
      if (activeTab === 'upcoming' && m.status !== 'scheduled' && m.status !== 'processing') {
        return false;
      }
      if (activeTab === 'past' && m.status !== 'processed' && m.status !== 'failed') {
        return false;
      }

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.participants.some((p) => p.name.toLowerCase().includes(q));

      // Status filter
      const matchesStatus =
        selectedStatus === 'all' || m.status === selectedStatus;

      // Platform filter
      const matchesPlatform =
        selectedPlatform === 'all' || m.platform === selectedPlatform;

      return matchesSearch && matchesStatus && matchesPlatform;
    })
    .sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.startTime || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.startTime || '00:00'}`).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Meetings Directory
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              {meetings.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upcoming schedules, processing queues, and past sessions with AI intelligence dossiers.
          </p>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Top Row: Segmented Tab Switcher & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Upcoming ({meetings.filter((m) => m.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'past'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Past / Processed ({meetings.filter((m) => m.status === 'processed').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title or attendee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bottom Row: Status, Platform, Sort */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>

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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Meetings List - Clean, hairline separated rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredMeetings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No meetings found matching your filter criteria.
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const hasReport = meeting.status === 'processed' && meeting.reportId;
            const targetHref = hasReport
              ? `/reports/${meeting.reportId}`
              : `/meetings/${meeting.id}`;

            return (
              <div
                key={meeting.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white dark:hover:bg-slate-900/60 p-2 -mx-2 rounded-xl transition-all"
              >
                {/* Left: Metadata & Title */}
                <div className="space-y-1.5 flex-1 min-w-0">
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

                  <Link
                    href={targetHref}
                    className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{meeting.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0" />
                  </Link>

                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      Agenda: {meeting.agenda.join(' · ')}
                    </p>
                  )}
                </div>

                {/* Right: Attendees & Context Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <AvatarGroup participants={meeting.participants} max={4} size="sm" />
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {meeting.participants.length} attendees
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasReport ? (
                      <Link
                        href={`/reports/${meeting.reportId}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => openAssistant(meeting.id, meeting.title)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors inline-flex items-center gap-1.5"
                          title="Start live assistant capture"
                        >
                          <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          <span>Assist</span>
                        </button>

                        <Link
                          href={`/meetings/${meeting.id}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Prep & Details
                        </Link>

                        {meeting.joinUrl && (
                          <a
                            href={meeting.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Join</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Delete meeting "${meeting.title}"?`)) {
                              deleteMeeting(meeting.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          title="Delete meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
